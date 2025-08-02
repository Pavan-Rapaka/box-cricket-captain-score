import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, User, Mail, CheckCircle } from 'lucide-react';
import { Tournament } from '@/pages/Tournament';

interface TournamentPaymentProps {
  tournament: Tournament;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

const TournamentPayment = ({ tournament, onPaymentComplete, onCancel }: TournamentPaymentProps) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'bank'>('card');
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    setProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      setShowPaymentSuccess(true);
    }, 2000);
  };

  const handlePaymentSuccess = () => {
    onPaymentComplete();
    setShowPaymentSuccess(false);
  };

  if (showPaymentSuccess) {
    return (
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-600">Payment Successful!</h2>
            <p className="text-muted-foreground">
              You have successfully registered for {tournament.name}
            </p>
            <Button onClick={handlePaymentSuccess} className="w-full">
              Continue to Tournament
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tournament Entry</h1>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Entry Fee</p>
              <p className="text-2xl font-bold">₹{tournament.entryFee}</p>
            </div>

            {/* Player Details */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="playerName">Player Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('card')}
                >
                  Card
                </Button>
                <Button
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('upi')}
                >
                  UPI
                </Button>
                <Button
                  variant={paymentMethod === 'bank' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPaymentMethod('bank')}
                >
                  Bank
                </Button>
              </div>
            </div>

            {/* Payment Form */}
            {paymentMethod === 'card' && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div>
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="text-center text-sm text-muted-foreground">
                You will be redirected to your bank's payment page
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handlePayment} 
                disabled={processing || !playerName || !email}
                className="flex-1"
              >
                {processing ? 'Processing...' : `Pay ₹${tournament.entryFee}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TournamentPayment;