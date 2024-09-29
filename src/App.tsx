import { motion } from 'framer-motion'
import { CreditCard, Home, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

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

function MenuBottomBar() {
  let [tapped, setTapped] = useState(false)

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
      onPointerDown={() => setTapped(true)}
      onPointerUp={() => setTapped(false)}
      onMouseDown={() => setTapped(true)}
      onMouseUp={() => setTapped(false)}
    >
      <motion.path
        variants={pathVariants}
        animate={tapped ? 'path1' : 'path2'}
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

export function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="flex items-center justify-center p-4 bg-white shadow-sm">
        <h1 className="text-xl font-bold ">Barcodey</h1>
      </header>

      <main className="flex-grow overflow-hidden">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {loyaltyCards.map(card => (
              <Card key={card.id} className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.name}</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{card.barcode}</div>
                  <Barcode value={card.barcode} />
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </main>

      <footer className="relative shadow-sm">
        <MenuBottomBar />

        <div className="relative flex justify-evenly items-center py-4 pointer-events-none">
          <Button variant="ghost" size="icon">
            <Home className="h-6 w-6 fill-accent" />
          </Button>

          <Button variant="ghost" className="bg-black rounded-full w-12 h-12 min-w-12" size="icon">
            <Plus className="h-6 w-6" color="white" />
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-6 w-6 fill-accent" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
