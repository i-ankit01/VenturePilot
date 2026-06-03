from pydantic import BaseModel
from typing import List

class MarketResearchOutput(BaseModel):
    problem_statement: str          # crisp 2-3 line problem definition
    target_audience: str            # who exactly suffers from this
    market_size: str                # TAM / SAM / SOM estimates
    market_trends: List[str]        # 4-6 bullet trends
    pain_points: List[str]          # top 4-5 user pain points
    opportunity_gap: str            # what's missing in the market
    key_assumptions: List[str]      # things to validate
    sources: List[str]              # URLs used
    