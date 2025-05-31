
"use client";

import { useState, useEffect, useTransition, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfileEditFormData } from '@/types';
import { profileEditSchema } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserCircle, UploadCloud, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Helper function to convert File to Data URI
const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      displayName: '',
      photoURL: '',
    },
  });

  useEffect(() => {
    if (user?.profile) {
      form.reset({
        displayName: user.profile.displayName || '',
        photoURL: user.profile.photoURL || '',
      });
      if (user.profile.photoURL) {
        setImagePreview(user.profile.photoURL);
      }
    }
  }, [user, form]);

  // Clean up preview URLs
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview); 
      }
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      // Revert to user's current photoURL from profile if file is deselected
      setImagePreview(user?.profile?.photoURL || null);
    }
  };

  const onSubmit = async (data: ProfileEditFormData) => {
    if (!user) return;

    startSubmitTransition(async () => {
      let newPhotoURL = data.photoURL; // Keep existing photoURL if no new image
      if (imageFile) {
        try {
          newPhotoURL = await fileToDataUri(imageFile);
        } catch (error) {
          console.error("Error converting file to Data URI:", error);
          toast({ variant: "destructive", title: "Erro de Imagem", description: "Não foi possível processar a imagem." });
          return;
        }
      } else if (data.photoURL === '' && user.profile?.photoURL && !imageFile) {
        // If the photoURL field was cleared in the form AND no new file was uploaded,
        // it means the user wants to remove the photo.
        // If data.photoURL is undefined from form (e.g. if it wasn't a field), then we check if imageFile is null
        // and original user.profile.photoURL existed. For now, data.photoURL is '' when cleared.
        // This logic can be subtle. If they clear the text field for photoURL (if we had one) AND don't upload a new file, set it to empty.
        // With current setup, if no new imageFile, photoURL remains as data.photoURL (which is initial value or user-typed if it was a text field).
        // If they *clear* a photo (e.g. by a "remove photo" button, not implemented here), newPhotoURL should be ''.
        // The current schema allows `photoURL` to be an empty string or optional.
        // For simplicity: if they don't upload a new file, the original `data.photoURL` (from `form.getValues()`) is used.
        // If they want to remove: we'd need a separate mechanism or they just don't upload a new one, keeping the old if any.
        // To allow REMOVING photo by not selecting a new one, if current form has an empty photoURL and no new file, set it to empty string.
        // This depends if photoURL is a hidden field or tied to the file upload.
        // Let's assume if imageFile is null, but imagePreview was cleared (meaning they interacted to remove), we'd send empty.
        // Current setup: if imageFile is null, we take form's photoURL which is initialized from profile.
        // If they *delete* an image (not implemented), or upload nothing new, current photoURL is kept unless they could type it.
        // For now: if `imageFile` is present, it overrides. If not, `data.photoURL` (from form state) is used.
        // If `data.photoURL` was manually cleared (e.g. if it was an input field, not now) then it's an empty string.
        // Let's make it explicit: if imageFile is null AND user explicitly cleared preview, set to empty
        // For now, if no new image file, initial data.photoURL is used.
      }


      try {
        await updateUserProfile({
          displayName: data.displayName,
          photoURL: newPhotoURL, // This will be the Data URI or the existing URL
        });
        // No need to router.push, AuthContext will update user, and form will re-sync with useEffect
        // Optionally, redirect or give more feedback
      } catch (error) {
        // Error toast is handled by AuthContext's updateUserProfile
      }
    });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This should ideally be handled by a protected route layout for /profile/*
    router.replace('/login?origin=profile');
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <p>Redirecionando para login...</p>
        </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <Button variant="outline" asChild className="mb-6 group">
        <Link href="/desktop"> {/* Or back to where they came from, e.g. /mobile or /tablet */}
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Voltar ao Painel
        </Link>
      </Button>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold font-headline flex items-center">
            <UserCircle className="mr-3 h-7 w-7 text-primary" /> Editar Perfil
          </CardTitle>
          <CardDescription>
            Atualize seu nome de exibição e foto de perfil.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Exibição</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormDescription>
                      Este nome será exibido para outros usuários.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Foto de Perfil</FormLabel>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="Pré-visualização do perfil"
                      width={80}
                      height={80}
                      className="rounded-full object-cover aspect-square border"
                      data-ai-hint="user profile picture"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center border">
                      <UserCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary/10 file:text-primary
                        hover:file:bg-primary/20 cursor-pointer"
                    />
                  </FormControl>
                </div>
                <FormDescription className="mt-2">
                  Envie uma nova foto (PNG, JPG, WEBP). Se nenhuma for selecionada, a atual será mantida.
                </FormDescription>
                 <FormMessage>{form.formState.errors.photoURL?.message}</FormMessage> {/* Though photoURL isn't directly validated for file type by Zod here */}
              </FormItem>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button type="submit" disabled={isSubmitting || authLoading} size="lg">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar Alterações
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
