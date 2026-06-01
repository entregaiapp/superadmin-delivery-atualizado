import { useState } from "react";
import { useForm as useRHForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "../../hooks/useAuth";
import { authService } from "../../features/auth/authService";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  MfaLoginStep,
  type MfaSession,
} from "../../features/auth/MfaLoginStep";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;
type ApiError = {
  response?: {
    data?: { error?: string | { message?: string }; message?: string };
  };
};

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mfaSession, setMfaSession] = useState<MfaSession | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useRHForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError("");
      const response = await authService.login(data.email, data.password);

      if (response.access_token) {
        login(response.access_token, response.user, response.refresh_token);
        if (response.mfa_required && response.aal !== "aal2") {
          setMfaSession(response);
          return;
        }
        navigate("/");
      } else {
        setError("Erro ao autenticar. Tente novamente.");
      }
    } catch (err: unknown) {
      const apiError = (err as ApiError).response?.data?.error;
      setError(
        typeof apiError === "string"
          ? apiError
          : apiError?.message ||
              (err as ApiError).response?.data?.message ||
              "E-mail ou senha incorretos.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/image.png"
              alt="Marca"
              className="h-16 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Bem-vindo de volta
          </CardTitle>
          <CardDescription>
            Entre com suas credenciais de Superadmin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaSession ? (
            <MfaLoginStep
              session={mfaSession}
              onCancel={() => {
                logout();
                setMfaSession(null);
              }}
              onComplete={(session) => {
                login(
                  session.access_token,
                  session.user,
                  session.refresh_token,
                );
                navigate("/");
              }}
            />
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-100/50 rounded-md text-center">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@exemplo.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <span className="text-xs text-red-500">
                    {errors.email.message}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <span className="text-xs text-red-500">
                    {errors.password.message}
                  </span>
                )}
              </div>
              <Button type="submit" className="w-full mt-6" disabled={loading}>
                {loading ? "Entrando..." : "Entrar no painel"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
