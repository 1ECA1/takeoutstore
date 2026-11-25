
import {
  ShoppingBag,
  Smartphone,
  Headphones,
  Watch,
  Shirt,
  Camera,
  Laptop,
  Glasses,
  Footprints,
  Backpack,
  Gamepad2,
  Package,
  Gem,
  Monitor,
  Keyboard,
  Gift,
  Wallet,
  Coffee,
} from "lucide-react";

const decorations = [
  { Icon: ShoppingBag, top: "6%", left: "4%", delay: "0s", duration: "9s", movement: "float-a", color: "#1B3C2B" },
  { Icon: Smartphone, top: "13%", left: "28%", delay: "2s", duration: "12s", movement: "float-b", color: "#3D6A52" },
  { Icon: Headphones, top: "8%", left: "68%", delay: "1s", duration: "10s", movement: "float-c", color: "#C18B36" },
  { Icon: Watch, top: "23%", left: "94%", delay: "3s", duration: "13s", movement: "float-b", color: "#1B3C2B" },
  { Icon: Shirt, top: "34%", left: "10%", delay: "1s", duration: "11s", movement: "float-c", color: "#C18B36" },
  { Icon: Camera, top: "42%", left: "43%", delay: "4s", duration: "14s", movement: "float-a", color: "#3D6A52" },
  { Icon: Laptop, top: "31%", left: "81%", delay: "2s", duration: "10s", movement: "float-b", color: "#1B3C2B" },
  { Icon: Glasses, top: "57%", left: "3%", delay: "3s", duration: "12s", movement: "float-a", color: "#C18B36" },
  { Icon: Footprints, top: "68%", left: "25%", delay: "1s", duration: "11s", movement: "float-c", color: "#3D6A52" },
  { Icon: Backpack, top: "77%", left: "65%", delay: "4s", duration: "13s", movement: "float-b", color: "#1B3C2B" },
  { Icon: Gamepad2, top: "86%", left: "90%", delay: "2s", duration: "10s", movement: "float-a", color: "#C18B36" },
  { Icon: Package, top: "92%", left: "43%", delay: "3s", duration: "12s", movement: "float-c", color: "#3D6A52" },
  { Icon: ShoppingBag, top: "48%", left: "96%", delay: "5s", duration: "14s", movement: "float-b", color: "#1B3C2B" },
  { Icon: Smartphone, top: "83%", left: "8%", delay: "2s", duration: "11s", movement: "float-a", color: "#C18B36" },
  { Icon: Gem, top: "19%", left: "52%", delay: "3s", duration: "13s", movement: "float-c", color: "#3D6A52" },
  { Icon: Monitor, top: "61%", left: "76%", delay: "1s", duration: "12s", movement: "float-b", color: "#1B3C2B" },
  { Icon: Keyboard, top: "72%", left: "47%", delay: "4s", duration: "10s", movement: "float-a", color: "#C18B36" },
  { Icon: Gift, top: "5%", left: "88%", delay: "2s", duration: "14s", movement: "float-c", color: "#3D6A52" },
  { Icon: Wallet, top: "39%", left: "62%", delay: "5s", duration: "11s", movement: "float-b", color: "#1B3C2B" },
  { Icon: Coffee, top: "89%", left: "72%", delay: "3s", duration: "13s", movement: "float-a", color: "#C18B36" },
];

const StoreBackgroundDecor = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <style>
        {`
          @keyframes store-float-a {
            0%, 100% {
              transform: translate(0, 0) rotate(-10deg);
            }
            50% {
              transform: translate(16px, -22px) rotate(12deg);
            }
          }

          @keyframes store-float-b {
            0%, 100% {
              transform: translate(0, 0) rotate(8deg);
            }
            50% {
              transform: translate(-18px, -16px) rotate(-12deg);
            }
          }

          @keyframes store-float-c {
            0%, 100% {
              transform: translate(0, 0) rotate(-5deg);
            }
            50% {
              transform: translate(10px, 20px) rotate(15deg);
            }
          }

          .store-floating-item {
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
            will-change: transform;
          }

          .float-a {
            animation-name: store-float-a;
          }

          .float-b {
            animation-name: store-float-b;
          }

          .float-c {
            animation-name: store-float-c;
          }

          @media (prefers-reduced-motion: reduce) {
            .store-floating-item {
              animation: none;
            }
          }
        `}
      </style>

      {decorations.map(({ Icon, top, left, delay, duration, movement, color }, index) => (
        <Icon
          key={index}
          size={20}
          strokeWidth={1.8}
          className={`store-floating-item ${movement} absolute`}
          style={{
            top,
            left,
            color,
            opacity: 0.48,
            animationDelay: delay,
            animationDuration: duration,
          }}
        />
      ))}
    </div>
  );
};

export default StoreBackgroundDecor;
