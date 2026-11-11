import { Redirect, Stack } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/kit";
export default function AuthLayout() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  if (session?.isAdmin) return <Redirect href="/products" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
