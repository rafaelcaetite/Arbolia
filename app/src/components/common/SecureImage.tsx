import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, User } from 'lucide-react';

interface SecureImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  fallbackInitial?: string;
  bucket?: 'Profiles' | 'Gallery' | 'Documents';
}

export function SecureImage({ src, alt, className = "", fallbackInitial, bucket = 'Profiles' }: SecureImageProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSecureUrl = async () => {
      if (!src) {
        setDisplayUrl(null);
        return;
      }

      // Se for URL externa ou base64, usa direto
      if (src.startsWith('http') && !src.includes('storage')) {
        setDisplayUrl(src);
        return;
      }
      if (src.startsWith('data:')) {
        setDisplayUrl(src);
        return;
      }

      // Se for caminho do storage
      setLoading(true);
      try {
        const path = src.includes(`${bucket}/`) 
          ? src.split(`${bucket}/`).pop() 
          : src;

        if (path) {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600);

          if (isMounted) {
            if (data) setDisplayUrl(data.signedUrl);
            else setDisplayUrl(src); // Fallback para o src original se falhar
          }
        }
      } catch (err) {
        if (isMounted) setDisplayUrl(src);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSecureUrl();

    return () => {
      isMounted = false;
    };
  }, [src, bucket]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-50 border border-slate-100 ${className}`}>
        <Loader2 className="animate-spin text-primary/40" size={20} />
      </div>
    );
  }

  if (!displayUrl && fallbackInitial) {
    return (
      <div className={`bg-primary text-white flex items-center justify-center font-black ${className}`}>
        {fallbackInitial}
      </div>
    );
  }

  if (!displayUrl) {
    return (
      <div className={`bg-slate-100 text-slate-400 flex items-center justify-center ${className}`}>
        <User size={20} />
      </div>
    );
  }

  return (
    <img 
      src={displayUrl} 
      alt={alt} 
      className={`${className} object-cover`}
    />
  );
}
