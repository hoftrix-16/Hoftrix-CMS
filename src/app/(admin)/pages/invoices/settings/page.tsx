'use client'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap'
import api from '@/helpers/api'
import { toast } from 'react-toastify'
import type { CompanySettings } from '@/types/invoice'
import { DEFAULT_NOTES, DEFAULT_TERMS } from '@/types/invoice'

const InvoiceSettingsPage = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [form, setForm] = useState<CompanySettings>({
    legalName: 'Hoftrix Technologies Pvt Ltd',
    brandName: 'Hoftrix Technologies',
    address: 'Mohali, Punjab, India',
    email: 'finance@hoftrix.com',
    phone: '+91 7889356866',
    website: 'www.hoftrix.com',
    gstin: '',
    logoUrl: '',
    logoSize: 72,
    accentColor: '#FF4D00',
    signatureUrl: '',
    authorizedName: 'Ashu Sharma',
    authorizedDesignation: 'Founder',
    bankName: 'IndusInd Bank',
    bankAccountName: 'Hoftrix Technologies Pvt Ltd',
    bankAccountNumber: '201036328915',
    bankSwift: 'INDBINBB',
    bankIfsc: 'INDB0000254',
    bankAddress: 'IndusInd Bank, Daon Branch, Shop No. 2 Green Enclave, Chandigarh-Kharar Road, Village Daon, Mohali - 140301',
    defaultTerms: DEFAULT_TERMS,
    defaultNotes: DEFAULT_NOTES,
  })

  useEffect(() => {
    api
      .get('/erp/company-settings')
      .then((res) => setForm((prev) => ({ ...prev, ...res.data })))
      .catch(() => toast.error('Failed to load branding settings'))
      .finally(() => setLoading(false))
  }, [])

  const persistSettings = async (patch: Partial<CompanySettings>) => {
    const next = { ...form, ...patch }
    const res = await api.put('/erp/company-settings', next)
    setForm(res.data)
    return res.data
  }

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const data = new FormData()
    data.append('logo', e.target.files[0])
    try {
      const res = await api.post('/erp/company-settings/upload-logo', data)
      setForm({ ...form, logoUrl: res.data.url, ...(res.data.settings || {}) })
      toast.success('Logo saved to company settings')
    } catch {
      toast.error('Logo upload failed')
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const data = new FormData()
    data.append('signature', e.target.files[0])
    try {
      const res = await api.post('/erp/invoices/upload-signature', data)
      await persistSettings({ signatureUrl: res.data.url })
      toast.success('Signature saved permanently')
    } catch {
      toast.error('Signature upload failed')
    }
  }

  const initCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#111827'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
  }

  useEffect(() => {
    if (drawing) setTimeout(initCanvas, 50)
  }, [drawing])

  const canvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * canvas.width,
      y: ((e.clientY - rect.top) / rect.height) * canvas.height,
    }
  }

  const saveDrawnSignature = async () => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const dataUrl = canvas.toDataURL('image/png')
      const res = await api.post('/erp/invoices/draw-signature', { dataUrl })
      await persistSettings({ signatureUrl: res.data.url })
      setDrawing(false)
      toast.success('Signature saved permanently')
    } catch {
      toast.error('Could not save signature')
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await persistSettings(form)
      toast.success('Branding saved — all future invoices will use this')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-5 text-center">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <div className="p-4">
      <Button variant="link" className="text-muted p-0 mb-2" onClick={() => navigate('/pages/invoices')}>
        ← Back to invoices
      </Button>
      <h3 className="fw-bold mb-1">Invoice Branding</h3>
      <p className="text-muted small mb-4">
        Set once. Logo, signature, and company details apply automatically to every invoice.
      </p>

      <Form onSubmit={handleSave}>
        <Card className="border-0 mb-3" style={{ background: '#111827' }}>
          <Card.Body>
            <h6 className="fw-bold text-primary mb-3">Company Details</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Legal Name</Form.Label>
                  <Form.Control value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Brand Name</Form.Label>
                  <Form.Control value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Address</Form.Label>
                  <Form.Control value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Email</Form.Label>
                  <Form.Control value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Phone</Form.Label>
                  <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Website</Form.Label>
                  <Form.Control value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">GSTIN</Form.Label>
                  <Form.Control value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Accent Color</Form.Label>
                  <Form.Control type="color" value={form.accentColor} onChange={(e) => setForm({ ...form, accentColor: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Logo Size ({form.logoSize}px)</Form.Label>
                  <Form.Range min={40} max={120} value={form.logoSize} onChange={(e) => setForm({ ...form, logoSize: Number(e.target.value) })} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 mb-3" style={{ background: '#111827' }}>
          <Card.Body>
            <h6 className="fw-bold text-primary mb-3">Logo & Signature</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Company Logo</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleLogo} />
                  {form.logoUrl && (
                    <img src={form.logoUrl} alt="Logo" style={{ height: 56, marginTop: 10, objectFit: 'contain' }} />
                  )}
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Upload Signature</Form.Label>
                  <Form.Control type="file" accept="image/*" onChange={handleSignatureUpload} />
                  <Button size="sm" variant="outline-primary" className="mt-2" type="button" onClick={() => setDrawing((v) => !v)}>
                    {drawing ? 'Hide Draw Pad' : 'Draw Signature'}
                  </Button>
                  {form.signatureUrl && (
                    <div className="mt-2">
                      <img src={form.signatureUrl} alt="Signature" style={{ maxHeight: 56, maxWidth: 180, objectFit: 'contain', background: '#fff', padding: 4, borderRadius: 6 }} />
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            {drawing && (
              <div className="mb-3">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={140}
                  style={{ width: '100%', maxWidth: 400, height: 140, background: '#fff', borderRadius: 8, cursor: 'crosshair', touchAction: 'none' }}
                  onMouseDown={(e) => {
                    drawingRef.current = true
                    const ctx = canvasRef.current?.getContext('2d')
                    const p = canvasPos(e)
                    ctx?.beginPath()
                    ctx?.moveTo(p.x, p.y)
                  }}
                  onMouseMove={(e) => {
                    if (!drawingRef.current) return
                    const ctx = canvasRef.current?.getContext('2d')
                    const p = canvasPos(e)
                    ctx?.lineTo(p.x, p.y)
                    ctx?.stroke()
                  }}
                  onMouseUp={() => { drawingRef.current = false }}
                  onMouseLeave={() => { drawingRef.current = false }}
                />
                <div className="d-flex gap-2 mt-2">
                  <Button size="sm" variant="secondary" type="button" onClick={initCanvas}>Clear</Button>
                  <Button size="sm" variant="primary" type="button" onClick={saveDrawnSignature}>Save Signature</Button>
                </div>
              </div>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Authorized Name</Form.Label>
                  <Form.Control value={form.authorizedName} onChange={(e) => setForm({ ...form, authorizedName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Designation</Form.Label>
                  <Form.Control value={form.authorizedDesignation} onChange={(e) => setForm({ ...form, authorizedDesignation: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 mb-3" style={{ background: '#111827' }}>
          <Card.Body>
            <h6 className="fw-bold text-primary mb-3">Payment Information (Bank Details)</h6>
            <p className="small text-muted mb-3">Saved once — shown automatically on every invoice.</p>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Account Name</Form.Label>
                  <Form.Control value={form.bankAccountName || ''} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Bank Name</Form.Label>
                  <Form.Control value={form.bankName || ''} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Account Number</Form.Label>
                  <Form.Control value={form.bankAccountNumber || ''} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">IFSC Code</Form.Label>
                  <Form.Control value={form.bankIfsc || ''} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Swift Number</Form.Label>
                  <Form.Control value={form.bankSwift || ''} onChange={(e) => setForm({ ...form, bankSwift: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group className="mb-0">
                  <Form.Label className="small text-muted">Bank Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={form.bankAddress || ''}
                    onChange={(e) => setForm({ ...form, bankAddress: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <Card className="border-0 mb-3" style={{ background: '#111827' }}>
          <Card.Body>
            <h6 className="fw-bold text-primary mb-3">Default Notes & Terms</h6>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Default Notes</Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.defaultNotes} onChange={(e) => setForm({ ...form, defaultNotes: e.target.value })} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="small text-muted">Default Terms</Form.Label>
                  <Form.Control as="textarea" rows={4} value={form.defaultTerms} onChange={(e) => setForm({ ...form, defaultTerms: e.target.value })} />
                </Form.Group>
              </Col>
            </Row>
            <Button type="submit" variant="primary" className="fw-bold px-4" disabled={saving}>
              {saving ? 'Saving…' : 'Save Branding'}
            </Button>
          </Card.Body>
        </Card>
      </Form>
    </div>
  )
}

export default InvoiceSettingsPage
