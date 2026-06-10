import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/lib/supabase/server";
// import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  // let next = searchParams.get("next") ?? "/";
  // if (!next.startsWith("/")) {
  //   // if "next" is not a relative URL, use the default
  //   next = "/";
  // }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      //for creating all_profiles instance
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Error occured", userError.message);
        return NextResponse.redirect(`${origin}/error`);
      }

      // get the auth.users.id
      const userId = data.user.id;
      console.log("user id is ", userId);

      const { data: existingUser } = await supabase
        .from("all_profiles")
        .select("*")
        .eq("id", userId)
        .limit(1)
        .single();

      if (!existingUser) {
        console.log("trying to insert");
        const { error: insertError } = await supabase
          .from("all_profiles")
          .insert({
            id: userId,
            email: data.user.email,
            full_name: data.user.user_metadata.name,
          });

        if (insertError) {
          console.error("Error occured", insertError.message);
          return NextResponse.redirect(`${origin}/error`);
        }
      }

      let next = "/dashboard";
      if (!existingUser || !existingUser.onboarding_completed) {
        next = "/onboarding";
      }

      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
