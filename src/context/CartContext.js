import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // Add item or increment quantity if exists
  const addToCart = (product, unit = 'kg', amount = 1) => {
    setCartItems(prev => {
      const cartKey = `${product.id}-${unit}`;
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item => 
          item.cartKey === cartKey ? { ...item, qty: item.qty + amount } : item
        );
      }
      return [...prev, { ...product, unit, cartKey, qty: amount }];
    });
  };

  // Update exact quantity (useful for TextInput)
  const updateItemQty = (productId, unit = 'kg', newQty) => {
    setCartItems(prev => {
      const cartKey = `${productId}-${unit}`;
      if (newQty <= 0) {
        return prev.filter(item => item.cartKey !== cartKey);
      }
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item => 
          item.cartKey === cartKey ? { ...item, qty: newQty } : item
        );
      }
      return prev; 
    });
  };

  // Set exact quantity, adding item if needed
  const setItemQty = (product, unit = 'kg', newQty, remarks = '') => {
    setCartItems(prev => {
      const cartKey = `${product.id}-${unit}`;
      if (newQty <= 0) {
        return prev.filter(item => item.cartKey !== cartKey);
      }
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item => 
          item.cartKey === cartKey ? { ...item, qty: newQty, remarks } : item
        );
      }
      return [...prev, { ...product, unit, cartKey, qty: newQty, remarks }];
    });
  };

  // Decrement quantity or remove if reaches 0
  const removeFromCart = (productId, unit = 'kg') => {
    setCartItems(prev => {
      const cartKey = `${productId}-${unit}`;
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing && existing.qty > 1) {
        return prev.map(item => 
          item.cartKey === cartKey ? { ...item, qty: item.qty - 1 } : item
        );
      }
      return prev.filter(item => item.cartKey !== cartKey);
    });
  };

  // Remove completely regardless of quantity
  const deleteItem = (cartKey) => {
    setCartItems(prev => prev.filter(item => item.cartKey !== cartKey));
  };

  const clearCart = () => setCartItems([]);

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (parseFloat(item.price || 0) * item.qty);
  }, 0);

  // Helper to get quantity of a specific item+unit
  const getItemQty = (productId, unit = 'kg') => {
    const cartKey = `${productId}-${unit}`;
    const item = cartItems.find(i => i.cartKey === cartKey);
    return item ? item.qty : 0;
  };

  // Helper to check if any version of a product is in cart
  const isProductInCart = (productId) => {
    return cartItems.some(item => item.id === productId);
  };

  // Get total quantity of a product across all units
  const getProductTotalQty = (productId) => {
    return cartItems
      .filter(item => item.id === productId)
      .reduce((sum, item) => sum + item.qty, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      updateItemQty,
      setItemQty,
      removeFromCart, 
      deleteItem, 
      clearCart, 
      totalItems, 
      totalPrice,
      getItemQty,
      isProductInCart,
      getProductTotalQty
    }}>
      {children}
    </CartContext.Provider>
  );
};
