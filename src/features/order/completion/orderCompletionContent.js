export const getOrderCompletionContent = ({ manual = false, requestKind, receiptEmailProvided = false } = {}) => {
  if (manual) {
    return {
      title: "заявка оформлена",
      manual: true,
      paragraphs: [requestKind === "individual"
        ? "В ближайшее время мы свяжемся с вами и уточним детали индивидуальной вышивки"
        : "Заявка уже у нас. Менеджер свяжется с вами для уточнения деталей и расчёта стоимости."],
    };
  }
  return {
    title: "спасибо за заказ",
    manual: false,
    paragraphs: [
      receiptEmailProvided === true
        ? "Заказ успешно оплачен! Чек придёт вам на почту"
        : "Заказ успешно оплачен!",
      "В ближайшее время мы свяжемся с вами и пришлём эскиз на утверждение",
    ],
  };
};
