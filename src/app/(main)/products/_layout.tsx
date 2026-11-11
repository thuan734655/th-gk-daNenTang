import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function ProductsLayout() {
  const { session } = useAuth();
  if (!session?.isAdmin) return <Redirect href="/profile" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
