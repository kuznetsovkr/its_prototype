import FAQItem from "../components/FAQItem";

const faqData = [
  {
    question: "Как сделать заказ?",
    answer: "Вы можете оформить заказ через сайт, выбрав нужный товар и заполнив форму."
  },
  {
    question: "Какие способы оплаты вы принимаете?",
    answer: "Мы принимаем оплату картой, через СБП и наличными при получении."
  },
  {
    question: "Сколько времени занимает доставка?",
    answer: "Доставка по городу занимает 2-3 дня, по России — от 5 дней."
  }
];

const FAQPage = () => {
  return (
    <div className="faq-page">
      <h1>Часто задаваемые вопросы</h1>
      <div className="faq-list">
        {faqData.map((item, index) => (
          <FAQItem key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
