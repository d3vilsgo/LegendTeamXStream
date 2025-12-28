import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { AuthCredentials } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginScreenProps {
  onLogin: (credentials: AuthCredentials) => void;
  isLoading: boolean;
}

// Form validation schema
const loginSchema = z.object({
  username: z.string().min(1, { message: 'Kullanıcı adı zorunludur' }),
  password: z.string().min(1, { message: 'Şifre zorunludur' }),
  host: z.string().url({ message: 'Geçerli bir URL giriniz. Örnek: http://example.com' }),
});

export default function LoginScreen({ onLogin, isLoading }: LoginScreenProps) {
  const [loginError, setLoginError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<AuthCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      host: '',
      username: '',
      password: '',
    },
  });
  
  function onSubmit(data: AuthCredentials) {
    setLoginError(null);
    onLogin(data);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-2">
        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">IPTV Giriş</CardTitle>
            <CardDescription>
              IPTV hizmetine erişmek için Xtream API bilgilerinizi girin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="host">Sunucu Adresi</Label>
                <Input
                  id="host"
                  type="text"
                  placeholder="http://example.com:8080"
                  {...register('host')}
                />
                {errors.host && (
                  <p className="text-sm text-red-500">{errors.host.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı</Label>
                <Input
                  id="username"
                  placeholder="Kullanıcı adınızı girin"
                  {...register('username')}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Şifrenizi girin"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
              
              {loginError && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded">
                  {loginError}
                </div>
              )}
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş Yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              IPTV Oynatıcısına hoş geldiniz. Xtream API destekli IPTV servisinize bağlanmak için gerekli bilgileri girin.
            </p>
          </CardFooter>
        </Card>
        
        <div className="hidden lg:flex flex-col justify-center">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">
              IPTV Oynatıcısı
            </h1>
            <p className="text-slate-600 dark:text-slate-400 max-w-md">
              Tüm cihazlarınızdan IPTV içeriğinize erişin. Canlı TV, filmler, diziler ve daha fazlası!
            </p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Canlı TV kanalları ve kategorileri
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Film ve dizi arşivi
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Favoriler ve izleme geçmişi
              </li>
              <li className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Kullanımı kolay arayüz
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}