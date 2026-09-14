
import React, { useEffect, useState } from "react";
import { Modal, Form, Button, Alert, Spinner } from "react-bootstrap";
import { LockKeyhole, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";




const EmailModal = ({
  show,
  onHide,
  onVerifyPassword,
  onChangeEmail,
  onForgotPassword,
}) => {
  const [step, setStep] = useState(1);

  const [password, setPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) {
      setStep(1);
      setPassword("");
      setNewEmail("");
      setShowPassword(false);
      setError("");
      setLoading(false);
    }
  }, [show]);

  const handleVerifyPassword = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("Please enter your current password.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const isValid = await onVerifyPassword(password);

      if (isValid) {
        setStep(2);
        setError("");
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to verify password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e) => {
    e.preventDefault();

    if (!newEmail.trim()) {
      setError("Please enter your new email address.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await onChangeEmail(newEmail.trim());

      setPassword("");
      setNewEmail("");
      setStep(1);
      setError("");

      onHide();
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to change email."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  return (

    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="bg-light">
        <Modal.Title className="fw-bold fs-16 text-dark d-flex align-items-center">
          {step === 1 ? (
            <>
              <LockKeyhole size={18} className="me-2 text-danger" />
              Verify Password
            </>
          ) : (
            <>
              <Mail size={18} className="me-2 text-danger" />
              Change Email
            </>
          )}
        </Modal.Title>
      </Modal.Header>

      {step === 1 ? (
        <Form onSubmit={handleVerifyPassword}>
          <Modal.Body className="p-4">
            <p className="text-muted small mb-3">
              Enter your current password to continue changing your email
              address.
            </p>

            {error && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}

            <Form.Group>
              <Form.Label className="fw-bold small text-muted text-uppercase">
                Current Password
              </Form.Label>

              <div className="position-relative">
                <Form.Control
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your current password"
                  className="pe-5"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-muted me-2 p-1"
                  disabled={loading}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </Form.Group>

            <div className="text-end mt-2">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="border-0 bg-transparent text-danger small fw-semibold p-0"
                disabled={loading}
              >
                Forgot Password?
              </button>
            </div>
          </Modal.Body>

          <Modal.Footer className="bg-light">
            <Button
              variant="light"
              size="sm"
              className="fw-bold px-3 rounded-pill"
              onClick={onHide}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              type="submit"
              size="sm"
              className="fw-bold px-4 rounded-pill shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      ) : (
        <Form onSubmit={handleChangeEmail}>
          <Modal.Body className="p-4">
            <p className="text-muted small mb-3">
              Your password has been verified. Enter the new email address you
              want to use for your account.
            </p>

            {error && (
              <Alert variant="danger" className="py-2 small">
                {error}
              </Alert>
            )}

            <Form.Group>
              <Form.Label className="fw-bold small text-muted text-uppercase">
                New Email
              </Form.Label>

              <div className="position-relative">
                <Mail
                  size={17}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                />

                <Form.Control
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter your new email"
                  className="ps-5"
                  disabled={loading}
                />
              </div>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="bg-light">
            <Button
              variant="light"
              size="sm"
              className="fw-bold px-3 rounded-pill"
              onClick={() => {
                setStep(1);
                setError("");
              }}
              disabled={loading}
            >
              <ArrowLeft size={15} className="me-1" />
              Back
            </Button>

            <Button
              variant="danger"
              type="submit"
              size="sm"
              className="fw-bold px-4 rounded-pill shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Updating...
                </>
              ) : (
                "Change Email"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      )}
    </Modal>
  );
};

export default EmailModal;
