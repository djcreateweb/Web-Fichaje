# SSL wildcard para `*.presentia.es` (cuando tengas dominio y VPS)

1. Configura DNS del dominio con un registro `A` para `presentia.es` y wildcard `*.presentia.es` apuntando al VPS.
2. Instala certbot y plugin DNS de tu proveedor.
3. Ejecuta (ejemplo genérico con challenge DNS):

```bash
sudo certbot certonly \
  --manual \
  --preferred-challenges dns \
  -d presentia.es \
  -d '*.presentia.es'
```

4. Añade los TXT que solicite certbot en tu DNS.
5. Actualiza rutas de certificado en Nginx si cambian.

Notas:
- En local no necesitas wildcard SSL; usa `TENANT_SLUG` en `.env`.
- En producción elimina `TENANT_SLUG` y deja que `ResolveTenant` lea subdominio real.
