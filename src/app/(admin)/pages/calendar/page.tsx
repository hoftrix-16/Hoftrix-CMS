'use client'
import { useEffect, useState } from 'react'
import { Card, Col, Row, Button, Modal, Badge, Form } from 'react-bootstrap'
import api from '@/helpers/api'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageHeader from '@/components/PageHeader'
import { useAuthContext } from '@/context/useAuthContext'
import { toast } from 'react-toastify'

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  color: string;
  textColor?: string;
  extendedProps: {
    type: 'Project' | 'Employee Leave' | 'Invoice Due' | 'Company Holiday';
    description?: string;
    status?: string;
    progress?: string;
    employeeName?: string;
    designation?: string;
    reason?: string;
    invoiceNumber?: string;
    client?: string;
    amount?: string;
    holidayType?: string;
  };
}

const CalendarPage = () => {
  const { user } = useAuthContext()
  const isAdmin = user?.role === 'admin'
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  const [holidayForm, setHolidayForm] = useState({
    title: '',
    date: '',
    endDate: '',
    type: 'Company',
    description: '',
  })

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await api.get('/erp/calendar-events')
      setEvents(response.data || [])
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      toast.error('Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleEventClick = (info: any) => {
    const clickedEvent: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      allDay: info.event.allDay,
      color: info.event.backgroundColor,
      extendedProps: info.event.extendedProps as any
    }
    setSelectedEvent(clickedEvent)
    setShowModal(true)
  }

  const renderBadge = (status?: string) => {
    if (!status) return null
    let bg = 'info'
    if (status === 'Paid' || status === 'Approved' || status === 'Completed') bg = 'success'
    if (status === 'Unpaid' || status === 'Pending') bg = 'warning'
    if (status === 'Cancelled' || status === 'Rejected' || status === 'Terminated') bg = 'danger'
    return <Badge bg={bg} className="rounded-pill px-3 py-1 fs-11 ms-2">{status}</Badge>
  }

  const handleDeleteHoliday = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to remove this holiday?')) return
    const holidayId = eventId.replace(/^holiday-/, '')
    try {
      await api.delete(`/erp/holidays/${holidayId}`)
      toast.success('Holiday removed')
      setShowModal(false)
      fetchEvents()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove holiday')
    }
  }

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/erp/holidays', holidayForm)
      toast.success('Company holiday added')
      setShowHolidayModal(false)
      setHolidayForm({ title: '', date: '', endDate: '', type: 'Company', description: '' })
      fetchEvents()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add holiday')
    }
  }

  return (
    <div className="p-4">
      <PageHeader
        title="Central ERP Calendar"
        subtitle="Projects, invoices, employee leaves, and company holidays in one view."
        icon="iconamoon:calendar-1-duotone"
        actions={
          <div className="d-flex gap-2">
            {isAdmin && (
              <Button variant="primary" className="rounded-pill shadow-sm px-3 fw-bold" onClick={() => setShowHolidayModal(true)}>
                <IconifyIcon icon="bx:plus" className="me-1" /> Add Holiday
              </Button>
            )}
            <Button
              variant="soft-primary"
              className="rounded-pill shadow-sm px-3 fw-bold"
              onClick={fetchEvents}
              disabled={loading}
            >
              <IconifyIcon icon="bx:refresh" className={`me-1 ${loading ? 'spin-anim' : ''}`} /> Sync
            </Button>
          </div>
        }
      />

      <Row className="mb-4 g-3">
        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm rounded-4 p-3 h-100">
            <h6 className="fw-bold text-uppercase text-primary mb-3">Calendar Legend</h6>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-2">
                <span className="legend-indicator" style={{ backgroundColor: '#FF4D00' }}></span>
                <div>
                  <strong className="d-block text-dark small">Projects Deadlines</strong>
                  <span className="text-muted fs-11">Due dates for client deliverables</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="legend-indicator" style={{ backgroundColor: '#198754' }}></span>
                <div>
                  <strong className="d-block text-dark small">Approved Leaves</strong>
                  <span className="text-muted fs-11">Employee out-of-office dates</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="legend-indicator" style={{ backgroundColor: '#ffc107' }}></span>
                <div>
                  <strong className="d-block text-dark small">Pending Leaves</strong>
                  <span className="text-muted fs-11">Leaves awaiting review</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="legend-indicator" style={{ backgroundColor: '#dc3545' }}></span>
                <div>
                  <strong className="d-block text-dark small">Invoice Due Dates</strong>
                  <span className="text-muted fs-11">Unpaid billing deadlines</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="legend-indicator" style={{ backgroundColor: '#6f42c1' }}></span>
                <div>
                  <strong className="d-block text-dark small">Company Holidays</strong>
                  <span className="text-muted fs-11">Public and office holidays</span>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="legend-indicator" style={{ backgroundColor: '#6c757d' }}></span>
                <div>
                  <strong className="d-block text-dark small">Paid Invoices</strong>
                  <span className="text-muted fs-11">Successfully processed bills</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        <Col md={8} lg={9}>
          <Card className="border-0 shadow-sm rounded-4 p-4">
            {loading ? (
              <div className="p-5 text-center">
                <h5 className="text-muted animate__animated animate__pulse animate__infinite">
                  Loading central calendar schedules...
                </h5>
              </div>
            ) : (
              <div className="fc-wrapper">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek'
                  }}
                  editable={false}
                  selectable={false}
                  selectMirror={true}
                  dayMaxEvents={true}
                  eventClick={handleEventClick}
                  height="auto"
                />
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        {selectedEvent && (
          <>
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-uppercase fs-15 text-primary d-flex align-items-center">
                <IconifyIcon 
                  icon={
                    selectedEvent.extendedProps.type === 'Project' ? 'bx:briefcase' : 
                    selectedEvent.extendedProps.type === 'Employee Leave' ? 'bx:user' :
                    selectedEvent.extendedProps.type === 'Company Holiday' ? 'bx:party' : 'bx:receipt'
                  } 
                  className="me-2" 
                />
                {selectedEvent.extendedProps.type}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4">
              <h5 className="fw-bold text-dark mb-3">{selectedEvent.title}</h5>
              
              <div className="d-flex flex-column gap-2 mb-3">
                <div>
                  <strong className="text-muted small d-block">START DATE:</strong>
                  <span className="text-dark fw-medium">
                    {new Date(selectedEvent.start).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </span>
                </div>
                {selectedEvent.end && (
                  <div>
                    <strong className="text-muted small d-block">END DATE:</strong>
                    <span className="text-dark fw-medium">
                      {new Date(selectedEvent.end).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </span>
                  </div>
                )}
              </div>

              <hr />

              {/* Conditional Event Details */}
              {selectedEvent.extendedProps.type === 'Project' && (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">STATUS:</strong>
                    {renderBadge(selectedEvent.extendedProps.status)}
                  </div>
                  {selectedEvent.extendedProps.progress && (
                    <div className="d-flex align-items-center">
                      <strong className="text-muted small w-25">PROGRESS:</strong>
                      <span className="text-primary fw-bold">{selectedEvent.extendedProps.progress}</span>
                    </div>
                  )}
                  <div>
                    <strong className="text-muted small d-block mb-1">DESCRIPTION:</strong>
                    <p className="text-secondary small mb-0 bg-light p-2.5 rounded">
                      {selectedEvent.extendedProps.description}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.type === 'Employee Leave' && (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">EMPLOYEE:</strong>
                    <span className="text-dark fw-bold">{selectedEvent.extendedProps.employeeName}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">ROLE:</strong>
                    <span className="text-secondary small">{selectedEvent.extendedProps.designation}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">LEAVE STATUS:</strong>
                    {renderBadge(selectedEvent.extendedProps.status)}
                  </div>
                  <div>
                    <strong className="text-muted small d-block mb-1">REASON:</strong>
                    <p className="text-secondary small mb-0 bg-light p-2.5 rounded">
                      {selectedEvent.extendedProps.reason}
                    </p>
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.type === 'Invoice Due' && (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">INVOICE #:</strong>
                    <span className="text-primary fw-bold">{selectedEvent.extendedProps.invoiceNumber}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">CLIENT:</strong>
                    <span className="text-dark fw-bold">{selectedEvent.extendedProps.client}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">AMOUNT:</strong>
                    <span className="text-danger fw-bold fs-15">{selectedEvent.extendedProps.amount}</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">STATUS:</strong>
                    {renderBadge(selectedEvent.extendedProps.status)}
                  </div>
                </div>
              )}

              {selectedEvent.extendedProps.type === 'Company Holiday' && (
                <div className="d-flex flex-column gap-2">
                  <div className="d-flex align-items-center">
                    <strong className="text-muted small w-25">TYPE:</strong>
                    <Badge bg="soft-primary" className="text-primary">{selectedEvent.extendedProps.holidayType || 'Company'}</Badge>
                  </div>
                  <div>
                    <strong className="text-muted small d-block mb-1">DETAILS:</strong>
                    <p className="text-secondary small mb-0 bg-light p-2.5 rounded">
                      {selectedEvent.extendedProps.description}
                    </p>
                  </div>
                </div>
              )}
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0 justify-content-center">
              {isAdmin && selectedEvent.extendedProps.type === 'Company Holiday' && (
                <Button variant="danger" className="rounded-pill px-4" onClick={() => handleDeleteHoliday(selectedEvent.id)}>
                  <IconifyIcon icon="bx:trash" className="me-1" /> Remove Holiday
                </Button>
              )}
              <Button variant="secondary" className="rounded-pill px-4" onClick={() => setShowModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <Modal show={showHolidayModal} onHide={() => setShowHolidayModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold">Add Company Holiday</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddHoliday}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Holiday Name</Form.Label>
              <Form.Control required placeholder="e.g. Diwali" value={holidayForm.title} onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })} />
            </Form.Group>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-muted">Start Date</Form.Label>
                <Form.Control type="date" required value={holidayForm.date} onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })} />
              </div>
              <div className="col-md-6">
                <Form.Label className="small fw-bold text-muted">End Date (optional)</Form.Label>
                <Form.Control type="date" value={holidayForm.endDate} onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })} />
              </div>
            </div>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-muted">Type</Form.Label>
              <Form.Select value={holidayForm.type} onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}>
                <option value="Public">Public Holiday</option>
                <option value="Company">Company Holiday</option>
                <option value="Optional">Optional Holiday</option>
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label className="small fw-bold text-muted">Description</Form.Label>
              <Form.Control as="textarea" rows={2} value={holidayForm.description} onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="outline-secondary" className="rounded-pill" onClick={() => setShowHolidayModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="rounded-pill">Save Holiday</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <style>{`
        .legend-indicator {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          display: inline-block;
          flex-shrink: 0;
        }
        .fs-11 { font-size: 11px; }
        .fs-15 { font-size: 15px; }
        .fs-16 { font-size: 16px; }
        .spin-anim { animation: spin 1s linear infinite; }
        .p-2.5 { padding: 10px; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* FullCalendar customizations */
        .fc { font-family: inherit; }
        .fc-header-toolbar { margin-bottom: 1.5rem !important; }
        .fc-button-primary {
          background-color: var(--bs-primary) !important;
          border-color: var(--bs-primary) !important;
          border-radius: 30px !important;
          font-weight: 600;
          padding: 6px 16px !important;
        }
        .fc-button-primary:hover {
          background-color: #0b5ed7 !important;
          border-color: #0a58ca !important;
        }
        .fc-button-primary:disabled {
          background-color: #70b0ff !important;
          border-color: #70b0ff !important;
        }
        .fc-event {
          cursor: pointer;
          border-radius: 4px !important;
          padding: 2px 6px !important;
          font-size: 11px !important;
          border: none !important;
        }
        .fc-daygrid-day-number {
          font-size: 12px;
          font-weight: 600;
          color: #495057;
          text-decoration: none !important;
        }
        .fc-col-header-cell-cushion {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #6c757d;
          text-decoration: none !important;
        }
      `}</style>
    </div>
  )
}

export default CalendarPage
