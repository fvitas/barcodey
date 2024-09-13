import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Menu, Home, Settings, HelpCircle, ChevronRight, Plus } from 'lucide-react';

const loyaltyCards = [
  { id: 1, name: "Starbucks", barcode: "1234567890" },
  { id: 2, name: "Target", barcode: "2345678901" },
  { id: 3, name: "Walmart", barcode: "3456789012" },
  { id: 4, name: "Costco", barcode: "4567890123" },
  { id: 5, name: "Best Buy", barcode: "5678901234" },
];

function Barcode ({ value }) {
  // This is a simplified representation of a barcode
  // In a real app, you'd use a proper barcode generation library
  return (
    <div className="flex justify-center items-center h-16 bg-white">
      {value.split('').map((digit, index) => (
        <div
          key={index}
          className="h-full w-1 mx-0.5"
          style={{
            backgroundColor: Math.random() > 0.5 ? 'black' : 'white'
          }}
        />
      ))}
    </div>
  );
}

function SettingsMenu () {
  return <div className="py-4">
    <h2 className="mb-4 px-4 text-lg font-semibold">Settings</h2>
    <div className="space-y-6">
      <div className="flex justify-between items-center px-4">
        <span>Dark Mode</span>
        <Switch/>
      </div>
      <div className="px-4">
        <span className="block mb-2">Text Size</span>
        <Slider defaultValue={[50]} max={100} step={1}/>
      </div>
      <div className="px-4">
        <span className="block mb-2">Language</span>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select language"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="ghost" className="w-full justify-between px-4">
        Notifications
        <ChevronRight className="h-4 w-4"/>
      </Button>
      <Button variant="ghost" className="w-full justify-between px-4">
        Privacy
        <ChevronRight className="h-4 w-4"/>
      </Button>
      <Button variant="ghost" className="w-full justify-between px-4">
        About
        <ChevronRight className="h-4 w-4"/>
      </Button>
    </div>
  </div>;
}

export function App () {
  const [open, setOpen] = useState(false);
  const [activeView, setActiveView] = useState('cards');

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="flex items-center justify-between p-4 bg-white shadow-sm">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6"/>
            </Button>
          </SheetTrigger>

          <SheetContent side="left">
            <div className="py-4">
              <h2 className="mb-2 px-4 text-lg font-semibold">Menu</h2>
              <div className="space-y-1">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveView('cards')}>
                  <Home className="mr-2 h-4 w-4"/>
                  Home
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setActiveView('settings')}>
                  <Settings className="mr-2 h-4 w-4"/>
                  Settings
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <HelpCircle className="mr-2 h-4 w-4"/>
                  Help
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="text-xl font-bold">
          {activeView === 'cards' ? 'My Loyalty Cards' : 'Settings'}
        </h1>
        <div className="w-6"/>
      </header>

      <main className="flex-grow overflow-hidden">
        <ScrollArea className="h-full p-4">
          {activeView === 'cards' ? (
            <div className="space-y-4">
              {loyaltyCards.map((card) => (
                <Card key={card.id} className="bg-white">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.name}</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground"/>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">{card.barcode}</div>
                    <Barcode value={card.barcode}/>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <SettingsMenu/>
          )}
        </ScrollArea>
      </main>

      <footer className="bg-white shadow-sm">
        <div className="flex justify-around py-2">
          <Button variant="ghost" size="icon">
            <Home className="h-6 w-6"/>
          </Button>

          <Button variant="ghost" size="icon">
            <Plus className="h-6 w-6"/>
          </Button>

          <Button variant="ghost" size="icon">
            <Settings className="h-6 w-6"/>
          </Button>
        </div>
      </footer>
    </div>
  );
}
