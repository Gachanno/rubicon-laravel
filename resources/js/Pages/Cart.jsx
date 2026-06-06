import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import {
  fetchCart,
  updateCartItemAsync,
  removeCartItemAsync,
  clearCartAsync,
  confirmCartAsync,
} from '../store/cartSlice';
import ModalConfirm from '../Components/ModalConfirm';
import PaymentModal from '../Components/PaymentModal';
import CheckoutModal from '../Components/CheckoutModal';
import './cart.scss';
import { Link, usePage } from '@inertiajs/react';
import { requestsService } from '../api/api';

const CartPage = () => {
  const dispatch = useAppDispatch();
  const { auth } = usePage().props;
  const userId = auth?.user?.id;
  const savedAddress = auth?.user?.address || '';
  const cartItems = useAppSelector(state => state.cart.items);
  const loading = useAppSelector(state => state.cart.loading);

  const [modal,         setModal]        = useState({ open: false, action: null, payload: null });
  const [checkoutModal, setCheckoutModal] = useState({ open: false, action: null, payload: null });
  const [paymentModal,  setPaymentModal]  = useState({ open: false, action: null, payload: null });
  const [deliveryInfo,  setDeliveryInfo]  = useState(null);
  const [stockModal,    setStockModal]    = useState(false);
  const [showToast,     setShowToast]     = useState(false);
  const [toastMessage,  setToastMessage]  = useState('');

  useEffect(() => { dispatch(fetchCart()); }, []);

  const handleChangeQty = (productId, quantity) => {
    dispatch(updateCartItemAsync({ productId, quantity }));
  };

  const handleRemove = (productId) => {
    setModal({ open: true, action: 'remove', payload: productId });
  };

  const handleClearAll = () => {
    setModal({ open: true, action: 'clearAll' });
  };

  const handleConfirmAll = () => {
    setCheckoutModal({ open: true, action: 'confirmAll', payload: null });
  };

  const handleConfirm = (productId) => {
    setCheckoutModal({ open: true, action: 'confirm', payload: productId });
  };

  const handleModalConfirm = async () => {
    if (modal.action === 'remove') {
      dispatch(removeCartItemAsync(modal.payload));
    } else if (modal.action === 'clearAll') {
      dispatch(clearCartAsync());
    }
    setModal({ open: false, action: null, payload: null });
  };

  const handleModalCancel = () => {
    setModal({ open: false, action: null, payload: null });
  };

  // Step 1 completed: delivery info chosen → open payment
  const handleCheckoutReady = (info) => {
    const { action, payload } = checkoutModal;
    setCheckoutModal({ open: false, action: null, payload: null });
    setDeliveryInfo(info);
    setPaymentModal({ open: true, action, payload });
  };

  // Payment "Назад" → return to delivery method choice
  const handlePaymentBack = () => {
    const { action, payload } = paymentModal;
    setPaymentModal({ open: false, action: null, payload: null });
    setDeliveryInfo(null);
    setCheckoutModal({ open: true, action, payload });
  };

  // Step 2 completed: payment done → confirm order
  const handlePaymentConfirm = async () => {
    const { action, payload } = paymentModal;
    const delivery = deliveryInfo;
    setPaymentModal({ open: false, action: null, payload: null });
    setDeliveryInfo(null);

    const isDelivery = delivery?.deliveryMethod === 'delivery';

    if (isDelivery && delivery?.saveAddress && userId && delivery.deliveryAddress) {
      try { await requestsService.updateUser(userId, { address: delivery.deliveryAddress }); } catch {}
    }

    try {
      const args = action === 'confirmAll'
        ? { delivery }
        : { productIds: [payload], delivery };

      const result = await dispatch(confirmCartAsync(args)).unwrap();

      if (!result.success && result.adjusted) {
        setStockModal(true);
      } else if (result.success) {
        const base = 'Спасибо за покупку, заказ создан. Менеджер скоро обработает его. Можно узнать статус заказа в личном профиле.';
        const extra = isDelivery
          ? ' Трек-номер придёт по СМС или на почту после подтверждения заказа менеджером.'
          : '';
        setToastMessage(base + extra);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 12000);
      }
    } catch {
      setToastMessage('Ошибка при создании заказа');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 6000);
    }
  };

  if (loading && cartItems.length === 0) {
    return <div className="cart-page"><div className="loading">Загрузка...</div></div>;
  }

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1 className="cart-title">Корзина</h1>
        {cartItems.length > 0 && <span className="cart-total">Общая стоимость: {totalPrice} рублей</span>}
      </div>
      <div className="cart-list">
        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div>Корзина пуста</div>
            <div className="cart-empty__actions">
              <Link href="/products" className="btn cart-empty__btn">Каталог</Link>
              <Link href="/profile" className="btn cart-empty__btn">Мои заказы</Link>
            </div>
          </div>
        ) : (
          cartItems.map(item => (
            <div className="cart-item" key={item.productId}>
              <div className="cart-info">
                <img src={item.product.image || '/dataImg/noimagebig.png'} alt={item.product.name} className="cart-img" onError={e => { e.currentTarget.src = '/dataImg/noimagebig.png' }} />
                <div className="cart-details">
                  <Link className="cart-name" href={`/products/${item.productId}`}>{item.product.name}</Link>
                  <div className="cart-article">Артикул: {item.productId}</div>
                  <div className="cart-price">{item.product.price} ₽</div>
                </div>
              </div>
              <div className="cart-actions">
                <div className="cart__quantity">
                  <button className='qty-btn' onClick={() => handleChangeQty(item.productId, Math.max(1, item.quantity - 1))} disabled={item.quantity <= 1}>−</button>
                  <input className='qty-input' type="number" min="1" max={item.product.available_quantity} value={item.quantity}
                    onChange={e => handleChangeQty(item.productId, Math.max(1, Math.min(item.product.available_quantity, parseInt(e.target.value) || 1)))} />
                  <button className='qty-btn' onClick={() => handleChangeQty(item.productId, Math.min(item.product.available_quantity, item.quantity + 1))} disabled={item.quantity >= item.product.available_quantity}>+</button>
                </div>
                <button className="btn btn--confirm" onClick={() => handleConfirm(item.productId)}>Оформить</button>
                <button className="btn btn--remove" onClick={() => handleRemove(item.productId)}>Удалить</button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="cart-footer">
        {cartItems.length !== 0 && (
          <>
            <button className="btn btn--remove-all" onClick={handleClearAll}>Очистить корзину</button>
            <button className="btn btn--confirm-all" onClick={handleConfirmAll}>Оформить всё</button>
          </>
        )}
      </div>

      <ModalConfirm
        open={modal.open}
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
        action={modal.action}
      />

      <CheckoutModal
        open={checkoutModal.open}
        savedAddress={savedAddress}
        onReadyToPay={handleCheckoutReady}
        onCancel={() => setCheckoutModal({ open: false, action: null, payload: null })}
      />

      <PaymentModal
        open={paymentModal.open}
        title={paymentModal.action === 'confirmAll' ? 'Оплата всех товаров' : 'Оплата товара'}
        onConfirm={handlePaymentConfirm}
        onBack={handlePaymentBack}
        onCancel={() => {
          setPaymentModal({ open: false, action: null, payload: null });
          setDeliveryInfo(null);
        }}
      />

      {stockModal && (
        <div className="modal-confirm__overlay">
          <div className="modal-confirm__window">
            <div className="modal-confirm__text">Увы, у нас не хватило товаров. Мы обновили вашу корзину</div>
            <div className="modal-confirm__actions" style={{ justifyContent: 'center' }}>
              <button className="modal-confirm__btn modal-confirm__btn--success" onClick={() => setStockModal(false)}>Ок</button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="cart-toast">{toastMessage}</div>
      )}
    </div>
  );
};

export default CartPage;
