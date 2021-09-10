import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';
import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get(`http://localhost:3333/stock/${productId}`);

      const newCart = [...cart];
      const currentProduct = newCart.find(p => p.id === productId);

      const currentAmount = currentProduct ? currentProduct.amount : 0;
      const amount = currentAmount + 1;

      if (amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      if (currentProduct) {
        currentProduct.amount = amount;
      } else {
        const response = await api.get(`http://localhost:3333/products/${productId}`)
        const newProduct = {
          ...response.data,
          amount: 1
        }
        newCart.push(newProduct);
      }
      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = [...cart]
      const indexCart = newCart.findIndex(p => p.id === productId);
      if (indexCart !== -1) {
        newCart.splice(indexCart, 1);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) {
      return
    }
    try {
      const stock = await api.get(`http://localhost:3333/stock/${productId}`);
      if (amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      const newCart = [...cart];
      const currentProduct = newCart.find(p => p.id === productId)
      if (currentProduct) {
        currentProduct.amount = amount;
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
