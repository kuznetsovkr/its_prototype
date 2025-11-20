import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './reportWebVitals';
import "./assets/styles/main.scss";
import { OrderProvider } from "./context/OrderContext";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <OrderProvider>
    <App />
  </OrderProvider>
);
reportWebVitals();
