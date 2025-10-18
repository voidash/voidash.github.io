/**
 * JSON-LD Structured Data for SEO
 * https://schema.org/
 */

export function StructuredData() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Ashish Thapa',
    alternateName: 'voidash',
    url: 'https://ash9.dev',
    email: 'ashish.thapa477@gmail.com',
    jobTitle: 'Software Engineer',
    description: 'Software engineer exploring meaning, psychology, philosophy, and innate curiosity',
    sameAs: [
      'https://github.com/voidash',
      'https://x.com/rifeash',
      'https://twitter.com/rifeash',
    ],
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ashish Thapa',
    url: 'https://ash9.dev',
    description: 'Personal portfolio and digital garden',
    author: {
      '@type': 'Person',
      name: 'Ashish Thapa',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
    </>
  )
}
