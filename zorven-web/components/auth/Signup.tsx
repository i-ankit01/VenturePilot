"use client";

import { signInWithGoogle, signUp } from "@/actions/auth";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  const handleEmailSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!agreedToTerms) {
      toast.error("Terms required", {
        description: "Please agree to the terms and conditions to continue.",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await signUp(formData);

      if (result.status === "success") {
        toast.success("Account created!", {
          description: "Welcome to ZyqoMedia. Redirecting to sign in...",
        });
        router.push("/login");
      } else {
        toast.error("Sign up failed", {
          description: result.status || "Unable to create account. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!agreedToTerms) {
      toast.error("Terms required", {
        description: "Please agree to the terms and conditions to continue.",
      });
      return;
    }

    setGoogleLoading(true);
      toast.loading("Redirecting to Google...");
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error(err);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black mb-4">
            <span className="text-white text-xl font-bold">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Create your account
          </h1>
          <p className="text-sm text-gray-500">
            Join ZyqoMedia and start collaborating today
          </p>
        </div>

        {/* Google Sign Up */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-gray-300 hover:bg-gray-50"
          onClick={handleGoogleSignup}
          disabled={googleLoading || loading || !agreedToTerms}
        >
          {googleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Image
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              width={18}
              height={18}
              className="mr-2"
            />
          )}
          <span className="text-sm font-medium text-gray-700">
            Continue with Google
          </span>
        </Button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-900">
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              required
              className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              disabled={loading || googleLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-900">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a strong password (min. 8 characters)"
              required
              minLength={8}
              className="h-11 border-gray-300 focus:border-gray-900 focus:ring-gray-900"
              disabled={loading || googleLoading}
            />
            <p className="text-xs text-gray-500">
              Must be at least 8 characters long
            </p>
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              className="mt-0.5"
              disabled={loading || googleLoading}
            />
            <Label
              htmlFor="terms"
              className="text-xs text-gray-600 leading-relaxed cursor-pointer"
            >
              I agree to the{" "}
              <Link href="/terms" className="text-gray-900 underline hover:no-underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-gray-900 underline hover:no-underline">
                Privacy Policy
              </Link>
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading || googleLoading || !agreedToTerms}
            className="w-full h-11 bg-black hover:bg-gray-800 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-gray-900 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Trust Indicator */}
      <p className="text-center text-xs text-gray-500 mt-4">
        Where creators and brands collaborate with confidence
      </p>
    </div>
  );
}