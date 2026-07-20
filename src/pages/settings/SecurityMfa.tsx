import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2 } from "lucide-react";
import { authService } from "../../features/auth/authService";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { setRefreshToken, setToken } from "../../lib/auth";

type Factor = { id: string; friendly_name?: string };
type Enrollment = { id: string; totp: { qr_code: string; secret: string } };
type ApiError = { response?: { data?: { error?: { message?: string } } } };
const errorMessage = (error: unknown, fallback: string) =>
  (error as ApiError).response?.data?.error?.message || fallback;

export default function SecurityMfa() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => setFactors((await authService.mfaStatus()).factors || []);
  useEffect(() => {
    void authService.mfaStatus()
      .then((status) => setFactors(status.factors || []))
      .catch(() => setError("Não foi possível carregar os autenticadores."));
  }, []);

  const enroll = async () => {
    try {
      setLoading(true);
      setEnrollment(await authService.mfaEnroll());
    } catch (err: unknown) {
      setError(errorMessage(err, "Não foi possível cadastrar outro autenticador."));
    } finally {
      setLoading(false);
    }
  };

  const confirm = async () => {
    if (!enrollment || code.length !== 6) return;
    try {
      setLoading(true);
      const challenge = await authService.mfaChallenge(enrollment.id);
      const session = await authService.mfaVerify(enrollment.id, challenge.id, code);
      setToken(session.access_token);
      setRefreshToken(session.refresh_token);
      setEnrollment(null);
      setCode("");
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, "Código inválido."));
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      setLoading(true);
      await authService.mfaUnenroll(id);
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, "Não foi possível remover o autenticador."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col items-stretch gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
          <span className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Autenticação em dois fatores</span>
          <Button onClick={() => void enroll()} disabled={loading}><Plus className="mr-2 h-4 w-4" />Adicionar</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-500">Gerencie os aplicativos autenticadores vinculados ao seu acesso.</p>
        {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        {factors.map((factor) => (
          <div key={factor.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
            <span>{factor.friendly_name || "Aplicativo autenticador"}</span>
            <Button variant="ghost" size="icon" onClick={() => void remove(factor.id)} disabled={loading}><Trash2 className="h-4 w-4 text-red-500" /></Button>
          </div>
        ))}
        {enrollment && (
          <div className="rounded-md border bg-slate-50 p-4 text-center">
            <img src={enrollment.totp.qr_code} alt="QR code do autenticador" className="mx-auto h-44 w-44" />
            <p className="mt-2 text-xs text-slate-500">Chave manual: <span className="font-mono">{enrollment.totp.secret}</span></p>
            <Input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" className="mt-3 text-center font-mono tracking-[0.3em]" />
            <Button onClick={() => void confirm()} disabled={loading || code.length !== 6} className="mt-3">Confirmar autenticador</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
