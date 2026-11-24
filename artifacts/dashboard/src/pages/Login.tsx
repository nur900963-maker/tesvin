import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, User, Terminal } from "lucide-react";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CONFIG } from "@/config";
import bgImage from "@assets/IMG_20260528_130508_015_1782175582895.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        login(res.token);
        toast({ title: "Akses Diterima", description: `Selamat datang, ${res.user.username}!`, className: "bg-[#0a0e1a] border-[#00b4ff] text-white" });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Akses Ditolak", description: err?.data?.error || "Username atau password salah" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-black flex justify-center w-full font-sans text-white overflow-hidden">
      <div className="fixed inset-0 z-0 pointer-events-none flex justify-center">
        <div className="relative w-full max-w-[430px] h-full">
          <img src={bgImage} alt="bg" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-[#060a14]/82"></div>
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,180,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,180,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:linear-gradient(to_bottom,black_20%,transparent_80%)]"></div>
        </div>
      </div>

      <div className="z-10 w-full max-w-[430px] h-[100dvh] flex flex-col items-center justify-center p-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          {/* Hero banner — matches screenshot style */}
          <div className="relative rounded-2xl overflow-hidden mb-6 h-36 flex items-end justify-center">
            <img src={bgImage} alt="banner" className="absolute inset-0 w-full h-full object-cover object-top scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#060a14] via-[#060a14]/60 to-transparent" />
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative z-10 mb-4 text-3xl font-black tracking-widest text-white drop-shadow-[0_0_12px_rgba(0,180,255,0.9)]"
              style={{ fontFamily: "'Outfit', sans-serif", textShadow: "0 0 20px #00b4ff, 0 0 40px #00b4ff88" }}
            >
              {CONFIG.APP_NAME}
            </motion.h1>
          </div>

          <div className="cyber-card p-6 border-t-2 border-t-[#00b4ff]">
            <div className="flex items-center gap-2 mb-5 border-b border-[#00b4ff]/20 pb-3">
              <Terminal className="w-4 h-4 text-[#00b4ff]" />
              <span className="text-xs font-mono text-gray-400 animate-pulse">AWAITING_CREDENTIALS...</span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input placeholder="USERNAME" className="cyber-input pl-10 h-12 font-mono tracking-widest" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input type="password" placeholder="PASSWORD" className="cyber-input pl-10 h-12 font-mono" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-xs" />
                  </FormItem>
                )} />

                <Button type="submit" className="cyber-button w-full h-12 mt-2 tracking-widest text-base font-bold" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? <span className="animate-pulse">MEMPROSES...</span> : "MASUK SEKARANG"}
                </Button>
              </form>
            </Form>
          </div>

          <div className="mt-6 text-center text-[10px] text-gray-500 font-mono tracking-widest">
            <p>AKSES TANPA IZIN DILARANG KERAS</p>
            <p className="mt-1 text-[#00b4ff]/50">v{CONFIG.APP_VERSION}</p>
          </div>

          <div className="mt-4 text-center text-[9px] text-gray-600 font-mono">
            Dev {CONFIG.DEV} | Channel: {CONFIG.CHANNEL} | Tools: {CONFIG.TOOLS_NAME}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
