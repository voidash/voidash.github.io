import SimpleHomePage from '@/components/SimpleHomePage'
import ComplexHomePage from '@/components/ComplexHomePage'
import ModeToggle from '@/components/ModeToggle'

export default function Home() {
  return (
    <>
      <ModeToggle />
      <noscript>
        <SimpleHomePage />
      </noscript>
      <div className="js-only">
        <ComplexHomePage />
      </div>
    </>
  )
}
