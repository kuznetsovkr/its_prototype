import { Navigate } from "react-router-dom";
import { isCertificatePaymentReturn } from "./certificateStorage";
const CertificatePaymentReturn = ({ children, failed = false }) => isCertificatePaymentReturn()
  ? <Navigate to={"/certificate?payment=" + (failed ? "failed" : "return")} replace />
  : children;
export default CertificatePaymentReturn;
