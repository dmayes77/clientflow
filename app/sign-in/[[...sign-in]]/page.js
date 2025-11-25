import { SignIn } from "@clerk/nextjs";
import { Box } from "@mantine/core";

export default function SignInPage() {
  return (
    <Box
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(121, 80, 242, 0.05) 100%)",
      }}
    >
      <SignIn
        appearance={{
          elements: {
            rootBox: {
              boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)",
            },
            card: {
              borderRadius: "12px",
            },
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </Box>
  );
}
