"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signUp(formData: FormData) {
  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,

    // if you want to add some extra information in the users metadata then you can do it with the options field provided like this
    // options : {
    //   data : {
    //     username : credentials.username
    //   }
    // }
  });
  if (error) {
    return {
      status: error.message,
      user: null,
    };
  } else if (data.user?.identities?.length === 0) {
    return {
      status: "User already exists , please login ",
      user: null,
    };
  }

  revalidatePath("/", "layout"); // whenever auth state changes to change things in navbar and all
  return {
    status: "success",
    user: data.user,
  };
}

export async function signIn(formData: FormData) {
  const credentials = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return {
      status: error.message,
      user: null,
    };
  }

  const userId = data.user.id;

  // check if user already exists if not then create an instance in all_profiles table also

  const { data: existingUser } = await supabase
    .from("all_profiles")
    .select("*")
    .eq("id", userId)
    .limit(1)
    .single();

  if(!existingUser){
    const {error : insertError} = await supabase.from("all_profiles").insert({
      id: userId,
      email : data.user.email,
      full_name : data.user.user_metadata.name,
    })

    if(insertError){
      return {
        status : insertError.message,
        user : null
      }
    }
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    user: data.user,
  };
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/error");
  }

  // Re-run and refresh the layout and all pages under / because something changed.
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle() {
  // const origin = (await headers()).get("origin");
  const origin =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    redirect("/error");
  } else if (data.url) {
    return redirect(data.url);
  }
  return null;
}
