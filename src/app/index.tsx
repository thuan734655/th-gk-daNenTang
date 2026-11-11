import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "@/components/ui/kit";
export default function Index() {
  const { session, loading } = useAuth();
  if (loading) return <Loading />;
  return <Redirect href={session?.isAdmin ? "/products" : "/login"} />;
}
