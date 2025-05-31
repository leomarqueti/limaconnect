
"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';
import type { AuthError } from 'firebase/auth';

const registerSchema = z.object({
  email: z.string().email({ message: "Por favor, insira um email válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(6, { message: "A confirmação da senha deve ter pelo menos 6 caracteres." }),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"], // Campo onde o erro será exibido
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = useTransition();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    startSubmitTransition(async () => {
      try {
        await register(data.email, data.password);
        toast({
          title: "Registro bem-sucedido!",
          description: "Você foi logado automaticamente. Redirecionando...",
        });
        router.push('/mobile'); // Ou para a página inicial desejada para novos usuários
      } catch (error) {
        const authError = error as AuthError;
        let errorMessage = "Ocorreu um erro ao tentar registrar.";
        
        switch (authError.code) {
          case 'auth/email-already-in-use':
            errorMessage = "Este email já está em uso. Tente outro.";
            break;
          case 'auth/invalid-email':
            errorMessage = "O formato do email é inválido.";
            break;
          case 'auth/weak-password':
            errorMessage = "A senha é muito fraca. Use pelo menos 6 caracteres.";
            break;
          default:
            errorMessage = `Erro desconhecido: ${authError.message}`;
        }
        
        toast({
          variant: "destructive",
          title: "Falha no Registro",
          description: errorMessage,
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <UserPlus className="mx-auto h-10 w-10 text-primary mb-2" />
          <CardTitle className="text-2xl font-bold font-headline">Criar Nova Conta</CardTitle>
          <CardDescription>Preencha os campos abaixo para se registrar.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                {isSubmitting ? 'Registrando...' : 'Registrar'}
              </Button>
              <Button variant="link" asChild>
                <Link href="/login">Já tem uma conta? Faça login</Link>
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
