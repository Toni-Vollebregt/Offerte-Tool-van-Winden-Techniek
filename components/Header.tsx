import Image from 'next/image'
import Link from 'next/link'

export default function Header() {
  return (
    <header
      className="w-full border-b-2"
      style={{
        backgroundColor: '#2D2D2D',
        borderBottomColor: '#00E8FF',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <div className="relative h-12 w-40 flex-shrink-0">
            <Image
              src="/vanwinden_techniek_logo_transparant.png"
              alt="Van Winden Techniek logo"
              fill
              style={{ objectFit: 'contain', objectPosition: 'left center' }}
              onError={() => {/* silently skip if no logo */}}
              priority
            />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Van Winden Techniek</p>
            <p style={{ color: '#00E8FF' }} className="text-sm font-medium">Admin Tool</p>
          </div>
        </Link>
        <div className="ml-auto">
          <Link
            href="/admin"
            className="text-xs px-3 py-1 rounded border transition-colors"
            style={{
              color: '#00E8FF',
              borderColor: '#00E8FF',
            }}
          >
            Beheer
          </Link>
        </div>
      </div>
    </header>
  )
}
