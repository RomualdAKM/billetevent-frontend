export default defineEventHandler(async (event) => {
    const baseUrl = 'https://billetevent.com'
    
    // Pages statiques
    const staticPages = [
        '', '/events', '/about', '/faq', '/pricing', '/contact', '/social',
        '/legal/cgu', '/legal/cgv', '/legal/charte', '/legal/mentions', '/legal/privacy',
    ]
    
    // Récupérer les événements publiés depuis l'API backend
    let eventPages: string[] = []
    try {
        const apiBase = process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api'
        const response = await $fetch<any>(`${apiBase}/public/events?per_page=1000`)
        const events = response?.data || response || []
        eventPages = events.map((e: any) => `/events/${e.slug || e.id}`)
    } catch {
        // Silently fail — sitemap sans événements dynamiques
    }
    
    const allPages = [...staticPages, ...eventPages]
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `    <url>
        <loc>${baseUrl}${page}</loc>
        <changefreq>${page === '' ? 'daily' : page.startsWith('/events/') ? 'weekly' : 'monthly'}</changefreq>
        <priority>${page === '' ? '1.0' : page.startsWith('/events') ? '0.8' : '0.5'}</priority>
    </url>`).join('\n')}
</urlset>`
    
    setResponseHeader(event, 'content-type', 'application/xml')
    return xml
})
