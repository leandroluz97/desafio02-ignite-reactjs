import { error } from "node:console"
import { createContext, ReactNode, useContext, useState } from "react"
import { toast } from "react-toastify"
import { api } from "../services/api"
import { Product, Stock } from "../types"

interface CartProviderProps {
  children: ReactNode
}

interface UpdateProductAmount {
  productId: number
  amount: number
}

interface CartContextData {
  cart: Product[]
  addProduct: (productId: number) => Promise<void>
  removeProduct: (productId: number) => void
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    // if (storagedCart) {
    //   return JSON.parse(storagedCart);
    // }

    if (storagedCart) {
      return JSON.parse(storagedCart)
    }

    return []
  })

  const addProduct = async (productId: number) => {
    try {
      // TODO

      //check stock amount
      const stock = await api.get<Stock>(`/stock/${productId}`)

      //product to add
      const productInCard = cart.find((product) => product.id === productId)

      if (!productInCard) {
        api.get(`products/${productId}`).then((product) => {
          const productAmount = { ...product.data, amount: 1 }
          setCart([...cart, productAmount])
        })
      } else {
        if (stock.data.amount <= productInCard.amount) {
          toast.error("Quantidade solicitada fora de estoque")
          return
        }
        productInCard.amount += 1
        const newProductAmount = cart.map((product) => {
          if (product.id === productId) {
            product = { ...productInCard }
          }
          return product
        })

        setCart(newProductAmount)
      }
    } catch {
      // TODO

      toast.error("Erro na adição do produto")
    }
  }

  const removeProduct = (productId: number) => {
    try {
      // TODO
      const newCart = cart.filter((product) => product.id !== productId)
      setCart(newCart)
    } catch {
      // TODO
      toast.error("Erro na remoção do produto")
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      const stock = await api.get<Stock>(`/stock/${productId}`)
      if (stock.data.amount <= amount) {
        toast.error("Quantidade solicitada fora de estoque")
        return
      }

      const updateCard = cart.map((product) => {
        if (product.id === productId) {
          product.amount = amount
        }
        return product
      })
      setCart(updateCard)
    } catch {
      // TODO

      toast.error("Erro na alteração de quantidade do produto")
    }
  }

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextData {
  const context = useContext(CartContext)

  return context
}
