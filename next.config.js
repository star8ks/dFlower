export default async function config(phase, { defaultConfig }) {
  /**
   * @type {import('next').NextConfig}
   */
  const nextConfig = {
    typescript: {
      ignoreBuildErrors: true,
    }
  }
  return nextConfig
}