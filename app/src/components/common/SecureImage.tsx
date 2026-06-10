import { useState, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
import { Loader2, User } from 'lucide-react';

interface SecureImageProps {
  src: string | undefined | null;
  alt: string;
  className?: string;
  fallbackInitial?: string;
  bucket?: 'Profiles' | 'Gallery' | 'Documents';
  onClick?: () => void;
}

// Cache global em memória para URLs assinadas (evita requisições repetidas ao Firebase Storage)
const signedUrlCache: Record<string, { url: string; expires: number }> = {};

export function SecureImage({ src, alt, className = "", fallbackInitial, bucket = 'Profiles', onClick }: SecureImageProps) {
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

      // Verifica Cache primeiro
      const cacheKey = `${bucket}:${src}`;
      const cached = signedUrlCache[cacheKey];
      const now = Date.now();

      if (cached && cached.expires > now) {
        setDisplayUrl(cached.url);
        return;
      }

      // Se for caminho do storage e não estiver em cache válido
      setLoading(true);
      try {
        const path = src.includes(`${bucket}/`) 
          ? src.split(`${bucket}/`).pop() 
          : src;

        if (path) {
          const storageRef = ref(storage, `${bucket}/${path}`);
          const url = await getDownloadURL(storageRef);

          if (isMounted && url) {
            // Salva no cache por 55 minutos (para ter margem de segurança)
            signedUrlCache[cacheKey] = {
              url,
              expires: now + (55 * 60 * 1000)
            };
            setDisplayUrl(url);
          } else if (isMounted) {
            setDisplayUrl(src);
          }
        }
      } catch {
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
      onClick={onClick}
    />
  );
}
