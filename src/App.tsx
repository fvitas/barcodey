import { motion } from 'framer-motion'
import {
  CreditCard as IconCreditCard,
  Home as IconHome,
  Plus as IconPlus,
  Settings as IconSettings,
} from 'lucide-react'
import { useState } from 'react'
import { Routes, Route, Outlet, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Camera } from '@/routes/Camera.tsx'
import { Label } from '@components/ui/label.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select.tsx'
import { Switch } from '@components/ui/switch.tsx'

const loyaltyCards = [
  { id: 1, name: 'Starbucks', barcode: '1234567890' },
  { id: 2, name: 'Target', barcode: '2345678901' },
  { id: 3, name: 'Walmart', barcode: '3456789012' },
  { id: 4, name: 'Costco', barcode: '4567890123' },
  { id: 5, name: 'Best Buy', barcode: '5678901234' },
]

// function IconInCircle ({
//                          Icon,
//                          size = 48,
//                          iconColor = "white",
//                          circleColor = "black",
//                          strokeColor = "black"
//                        }) {
//   const padding = size * 0.2;  // 20% padding
//   const viewBoxSize = size + (padding * 2);
//   const centerPoint = viewBoxSize / 2;
//   const iconSize = size * 0.6;  // Icon takes up 60% of the circle's diameter
//
//   return (
//     <svg width={viewBoxSize} height={viewBoxSize} viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
//       <circle
//         cx={centerPoint}
//         cy={centerPoint}
//         r={size / 2}
//         fill={circleColor}
//         stroke={strokeColor}
//         strokeWidth="2"
//       />
//       <g transform={`translate(${centerPoint - iconSize / 2}, ${centerPoint - iconSize / 2})`}>
//         <foreignObject x="0" y="0" width={iconSize} height={iconSize}>
//           <Icon size={iconSize} color={iconColor}/>
//         </foreignObject>
//       </g>
//     </svg>
//   );
// }

interface MenuBottomBarProps {
  isTapped: boolean
}

function MenuBottomBar({ isTapped }: MenuBottomBarProps) {
  const path1 = ' M 0 0 C 85.36 27.035 166.723 27.065 244 0 L 244 100 L 0 100 L 0 0 Z '
  // const path1 = ' M 0 0 C 81.059 -29.583 162.433 -29.543 244 0 L 244 100 L 0 100 L 0 0 Z '
  const path2 = ' M 0 0 C 85.36 3.857 166.703 3.867 244 0 L 244 100 L 0 100 L 0 0 Z '

  const pathVariants = {
    path1: {
      d: path1,
      transition: {
        type: 'spring',
        stiffness: 1000,
        damping: 10,
      },
    },
    path2: {
      d: path2,
      transition: {
        type: 'spring',
        stiffness: 1000,
        damping: 10,
      },
    },
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      // viewBox="0 -22.172 244 122.172"
      viewBox="0 0 244 100"
      fill="white"
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 right-0 w-full h-[80px]"
    >
      <motion.path
        variants={pathVariants}
        animate={isTapped ? 'path1' : 'path2'}
        initial="path2"
        fill="white"
        style={{
          transformOrigin: 'center',
        }}
      />
    </svg>
  )
}

function Barcode({ value }) {
  // This is a simplified representation of a barcode
  // In a real app, you'd use a proper barcode generation library
  return (
    <div className="flex justify-center items-center h-16 bg-white">
      {value.split('').map((digit, index) => (
        <div
          key={index}
          className="h-full w-1 mx-0.5"
          style={{
            backgroundColor: Math.random() > 0.5 ? 'black' : 'white',
          }}
        />
      ))}
    </div>
  )
}

function NavigationFooter() {
  const [isTapped, setIsTapped] = useState(false)

  return (
    <footer className="relative shadow-sm">
      <MenuBottomBar isTapped={isTapped} />

      <nav className="relative flex justify-evenly items-center py-4">
        <Link to="/">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onPointerDown={() => setIsTapped(true)}
            onPointerUp={() => setIsTapped(false)}
          >
            <IconHome className="h-6 w-6 fill-accent" />
          </Button>
        </Link>

        <Link to="/camera">
          <Button
            className="bg-black rounded-full w-12 h-12 min-w-12"
            size="icon"
            onPointerDown={() => setIsTapped(true)}
            onPointerUp={() => setIsTapped(false)}
          >
            <IconPlus className="h-6 w-6" color="white" />
          </Button>
        </Link>

        <Link to="/settings">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onPointerDown={() => setIsTapped(true)}
            onPointerUp={() => setIsTapped(false)}
          >
            <IconSettings className="h-6 w-6 fill-accent" />
          </Button>
        </Link>
      </nav>
    </footer>
  )
}

const pageVariants = {
  initial: direction => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  in: {
    x: 0,
    opacity: 1,
  },
  out: direction => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
}

function Layout() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="flex items-center justify-center p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold ">Barcodey</h1>
      </header>

      <main className="flex-grow overflow-hidden">
        <Outlet />
      </main>

      <NavigationFooter />
    </div>
  )
}

function Home() {
  return (
    <ScrollArea className="h-full p-4">
      <motion.div className="space-y-4">
        {loyaltyCards.map(card => (
          <Card key={card.id} className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.name}</CardTitle>
              <IconCreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>

            <CardContent>
              <div className="text-2xl font-bold mb-2">{card.barcode}</div>
              <Barcode value={card.barcode} />
            </CardContent>
          </Card>
        ))}
      </motion.div>
    </ScrollArea>
  )
}

function Settings() {
  return (
    <div>
      {/*light/dark mode * card view, * sort by, name, date, usage * asc/desc * supported formats*/}

      <form className="grid w-full items-start gap-6 overflow-auto p-4 pt-0">
        <fieldset className="grid gap-6 rounded-lg p-4">
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark mode</Label>
              <Switch id="dark-mode" />
            </div>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="card-view">Card view</Label>
            <Select defaultValue="2d">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="2d">2D</SelectItem>
                <SelectItem value="3d">3D</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <Label htmlFor="sort-by">Sort by</Label>
            <Select defaultValue="date">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="usage">Usage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <label className="grid gap-3">
            <Label htmlFor="sort">Sort</Label>

            <Select defaultValue="descending">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="ascending">Ascending</SelectItem>
                <SelectItem value="descending">Descending</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </fieldset>
      </form>
    </div>
  )
}

function Photos() {
  return <div>Photos</div>
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        {/*<Route path="barcode/:id" element={<Barcode />} />*/}
        <Route path="settings" element={<Settings />} />
        <Route path="camera" element={<Camera />} />
        <Route path="photos" element={<Photos />} />
        {/*<Route path="*" element={<NoMatch />} />*/}
      </Route>
    </Routes>
  )
}
