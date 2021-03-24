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
      //check stock amount
      const stock = await api.get<Stock>(`/stock/${productId}`)
      const productInCard = cart.find((product) => product.id === productId)

      if (!productInCard) {
        const productFetch = await api.get(`products/${productId}`)
        const product = await productFetch.data

        const productAmount = { ...product, amount: 1 }
        setCart([...cart, productAmount])

        const cartStorage = [...cart, productAmount]
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(cartStorage))
      } else {
        //guard
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

        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(newProductAmount)
        )
      }
    } catch {
      toast.error("Erro na adição do produto")
    }
  }

  const removeProduct = (productId: number) => {
    try {
      const productInCard = cart.some((product) => product.id === productId)

      if (!productInCard) {
        toast.error("Erro na remoção do produto")
        return
      }

      const newCart = cart.filter((product) => product.id !== productId)
      setCart(newCart)

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(newCart))
    } catch {
      toast.error("Erro na remoção do produto")
    }
  }

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`)
      const stockAmount = await stock.data

      if (stockAmount.amount <= amount) {
        toast.error("Quantidade solicitada fora de estoque")
        return
      }
      if (amount < 1) return

      const updateCard = cart.map((product) => {
        if (product.id === productId) {
          product.amount = amount
        }
        return product
      })
      setCart(updateCard)

      localStorage.setItem("@RocketShoes:cart", JSON.stringify(updateCard))
    } catch {
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
