import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to LiveLocal</CardTitle>
        <CardDescription>Sign in to discover events near you</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <Button type="submit" className="w-full" size="lg">
            Continue with Google
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
