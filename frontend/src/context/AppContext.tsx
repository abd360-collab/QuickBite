import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import axios from "axios";
import { type AppContextType, type ICart, type LocationData, type User } from "../types";
import { authService, restaurantService } from "../main";
import { Toaster } from "react-hot-toast";

const AppContext = createContext<AppContextType | undefined>(undefined)


// 👉 ReactNode means:
// ➡️ “Anything React can render”
interface AppProviderProps {
    children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuth, setIsAuth] = useState(false);
    const [loading, setLoading] = useState(true);

    const [location, setLocation] = useState<LocationData | null>(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [city, setCity] = useState("Fetching Location...");




    async function fetchUser() {
        try {
            const token = localStorage.getItem("token")

            const { data } = await axios.get(`${authService}/api/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setUser(data);
            setIsAuth(true);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }


    const [cart, setCart] = useState<ICart[]>([]);
    const [subTotal, setSubTotal] = useState(0);
    const [quantity, setQuantity] = useState(0);

    async function fetchCart() {
        if(!user || user.role !== "customer") return;
        try {
            const {data} = await axios.get(`${restaurantService}/api/cart/all`, {
                 headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            })

            setCart(data.cart || [])
            setSubTotal(data.subTotal || 0)
            setQuantity(data.cartLength);
        } catch(error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    useEffect(() => {
        if(user && user.role == "customer") {
            fetchCart();
        }
    }, [user]);





useEffect(() => {
    // 1. Guard: If location is already set, don't do anything.
    // This stops Mount 2 from firing if Mount 1 actually succeeded 
    // (though usually, Mount 1 is too fast to finish).
    if (location || !navigator.geolocation) return;

    const controller = new AbortController();

    const getPosition = () => {
        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
                    { 
                        signal: controller.signal,
                        headers: { 'User-Agent': 'ChaubeyKitchen-App' } 
                    }
                );

                if (!res.ok) throw new Error(`Error: ${res.status}`);

                const data = await res.json();

                setLocation({
                    latitude,
                    longitude,
                    formattedAddress: data.display_name || "Current Location"
                });

                setCity(data.address?.city || data.address?.town || data.address?.village || "Your Location");
            } catch (error: any) {
                // 2. Silent Abort: Don't log errors if we purposefully cancelled the request
                if (error.name === 'AbortError') return;

                console.error("Geocoding failed:", error);
                setLocation({ latitude, longitude, formattedAddress: "Current Location" });
                setCity("Kolkata");
            } finally {
                // 3. Only set loading to false if we weren't aborted
                if (!controller.signal.aborted) {
                    setLoadingLocation(false);
                }
            }
        }, (err) => {
            console.error(err);
            setLoadingLocation(false);
        });
    };

    getPosition();

    return () => controller.abort();
}, []); // Keep dependency empty so it only tries on first load






    return (
        <AppContext.Provider value={{ 
            isAuth, 
        loading, 
        setIsAuth, 
        setLoading, 
        setUser, 
        user, 
        location, 
        loadingLocation, 
        city, 
        cart, 
        fetchCart, 
        quantity, 
        subTotal 
        }}>
            {children}
            <Toaster />
        </AppContext.Provider>
    );
};

export const useAppData = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppData must be used within AppProvider")
    }
    return context;
}