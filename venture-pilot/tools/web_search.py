"""
tools/web_search.py — Web search tool using Tavily.

Why Tavily and not Google/Serper?
  - Built specifically for LLM pipelines
  - Returns clean summarized content, not raw HTML
  - Has a generous free tier (1000 searches/month)
  - One API key, no scraping, no rate limit headaches

Used by:
  - research.py   → market size, trends, pain points
  - competitor.py → finding real competitors

Setup:
  pip install tavily-python
  Add TAVILY_API_KEY to your .env file
  Get your key at: https://tavily.com
"""

import os
from typing import List, Dict, Any
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()


class WebSearchTool:

    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise ValueError(
                "TAVILY_API_KEY not found in environment. "
                "Add it to your .env file. Get one at https://tavily.com"
            )
        self.client = TavilyClient(api_key=api_key)

    def search(
        self,
        query: str,
        max_results: int = 5,
        search_depth: str = "advanced"     # "basic" is faster, "advanced" is richer
    ) -> List[Dict[str, Any]]:
        """
        Run a single search query.

        Returns a list of results, each with:
          - title    : page title
          - url      : source URL
          - content  : clean extracted text (Tavily handles this)
          - score    : relevance score (0 to 1)
        """
        try:
            response = self.client.search(
                query=query,
                max_results=max_results,
                search_depth=search_depth
            )
            return response.get("results", [])
        except Exception as e:
            print(f"[WebSearchTool] Search failed for query '{query}': {e}")
            return []

    def search_multiple(
        self,
        queries: List[str],
        max_results_per_query: int = 4
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Run multiple queries and return results grouped by query.

        Usage:
            results = tool.search_multiple([
                "invoice SaaS market size India 2024",
                "freelancer payment problems pain points",
            ])

        Returns:
            {
                "invoice SaaS market size India 2024": [ ...results... ],
                "freelancer payment problems pain points": [ ...results... ],
            }
        """
        all_results = {}
        for query in queries:
            all_results[query] = self.search(query, max_results=max_results_per_query)
        return all_results

    def format_for_llm(
        self,
        results: Dict[str, List[Dict[str, Any]]]
    ) -> str:
        """
        Converts raw search results into a clean text block
        that you paste directly into an LLM prompt.

        Output looks like:
            === Query: invoice SaaS market size ===
            [1] Title: ...
                URL: ...
                Content: ...
            [2] ...
        """
        formatted = []
        for query, hits in results.items():
            formatted.append(f"\n=== Query: {query} ===")
            if not hits:
                formatted.append("  No results found.")
                continue
            for i, hit in enumerate(hits, 1):
                formatted.append(
                    f"  [{i}] Title: {hit.get('title', 'N/A')}\n"
                    f"      URL: {hit.get('url', 'N/A')}\n"
                    f"      Content: {hit.get('content', 'N/A')[:400]}..."  # trim long content
                )
        return "\n".join(formatted)