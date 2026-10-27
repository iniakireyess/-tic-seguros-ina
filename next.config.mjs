/** @type {import('next').NextConfig} */
const nextConfig = {
  // @libsql/client usa módulos nativos: se cargan tal cual en el servidor
  serverExternalPackages: ['@libsql/client', 'libsql'],
};

export default nextConfig;
