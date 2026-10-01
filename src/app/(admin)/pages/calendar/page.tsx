'use client'

import { useEffect,useRef, useState, type FormEvent } from 'react'
import {
  Card,
  Col,
  Row,
  Button,
  Modal,
  Badge,
  Form,
} from 'react-bootstrap'

import api from '@/helpers/api'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

import IconifyIcon from '@/components/wrappers/IconifyIcon'
import PageHeader from '@/components/PageHeader'
import { useAuthContext } from '@/context/useAuthContext'
import { toast } from 'react-toastify'

/* =========================================================
   TYPES
========================================================= */

interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  allDay: boolean
  color: string
  textColor?: string

  extendedProps: {
    type:
      | 'Project'
      | 'Employee Leave'
      | 'Invoice Due'
      | 'Company Holiday'
      | 'Festival / Public Holiday'

    description?: string
    status?: string
    progress?: string
    employeeName?: string
    designation?: string
    reason?: string
    invoiceNumber?: string
    client?: string
    amount?: string

    holidayType?: string
    source?: string
    localName?: string
    countryCode?: string
    isFestival?: boolean
  }
}

/* =========================================================
   COMPONENT
========================================================= */

const CalendarPage = () => {
  const { user } = useAuthContext()

  const isAdmin = user?.role === 'admin'

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
const calendarDateRef = useRef<Date>(new Date())
  const [selectedEvent, setSelectedEvent] =
    useState<CalendarEvent | null>(null)

  const [showModal, setShowModal] = useState(false)
  const [showHolidayModal, setShowHolidayModal] = useState(false)

  const [updatingHolidayStatus, setUpdatingHolidayStatus] =
    useState(false)

  const [holidayForm, setHolidayForm] = useState({
    title: '',
    date: '',
    endDate: '',
    type: 'Company',
    description: '',
  })

  /* =========================================================
     FETCH CALENDAR EVENTS
  ========================================================= */

  const fetchEvents = async () => {
    setLoading(true)

    try {
      const response = await api.get('/erp/calendar-events')

      console.log('Calendar events:', response.data)

      if (Array.isArray(response.data)) {
        setEvents(response.data)
      } else {
        setEvents([])
      }
    } catch (error) {
      console.error(
        'Error fetching calendar events:',
        error
      )

      toast.error('Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    fetchEvents()
  }, [])

  /* =========================================================
     EVENT CLICK
  ========================================================= */

  const handleEventClick = (info: any) => {
    const clickedEvent: CalendarEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr || undefined,
      allDay: info.event.allDay,
      color: info.event.backgroundColor,

      extendedProps: {
        ...(info.event.extendedProps || {}),
      },
    }

    console.log(
      'Selected event:',
      clickedEvent
    )

    setSelectedEvent(clickedEvent)
    setShowModal(true)
  }

  /* =========================================================
     STATUS BADGE
  ========================================================= */

  const renderBadge = (status?: string) => {
    if (!status) return null

    let bg:
      | 'info'
      | 'success'
      | 'warning'
      | 'danger'
      | 'secondary' = 'info'

    if (
      status === 'Paid' ||
      status === 'Approved' ||
      status === 'Completed' ||
      status === 'Holiday'
    ) {
      bg = 'success'
    }

    if (
      status === 'Unpaid' ||
      status === 'Pending'
    ) {
      bg = 'warning'
    }

    if (
      status === 'Cancelled' ||
      status === 'Rejected' ||
      status === 'Terminated'
    ) {
      bg = 'danger'
    }

    if (status === 'Working') {
      bg = 'secondary'
    }

    return (
      <Badge
        bg={bg}
        className="rounded-pill px-3 py-1 fs-11 ms-2"
      >
        {status}
      </Badge>
    )
  }

  /* =========================================================
     CHANGE HOLIDAY STATUS
  ========================================================= */

  const handleHolidayStatusChange = async (
    status: 'Holiday' | 'Working'
  ) => {
    if (!selectedEvent) return

    const holidayId = selectedEvent.id.replace(
      /^holiday-/,
      ''
    )

    try {
      setUpdatingHolidayStatus(true)

      await api.patch(
        `/erp/holidays/${holidayId}/status`,
        {
          status,
        }
      )

      const cleanTitle =
        selectedEvent.title.replace(
          ' - Working',
          ''
        )

      toast.success(
        status === 'Working'
          ? `${cleanTitle} marked as Working`
          : `${cleanTitle} marked as Holiday`
      )

      setShowModal(false)
      setSelectedEvent(null)

      await fetchEvents()
    } catch (err: any) {
      console.error(
        'Update holiday status error:',
        err
      )

      toast.error(
        err.response?.data?.message ||
          'Failed to update holiday status'
      )
    } finally {
      setUpdatingHolidayStatus(false)
    }
  }

  /* =========================================================
     DELETE HOLIDAY
  ========================================================= */

  const handleDeleteHoliday = async (
    eventId: string
  ) => {
    if (
      !window.confirm(
        'Are you sure you want to remove this holiday?'
      )
    ) {
      return
    }

    const holidayId = eventId.replace(
      /^holiday-/,
      ''
    )

    try {
      await api.delete(
        `/erp/holidays/${holidayId}`
      )

      toast.success('Holiday removed')

      setShowModal(false)
      setSelectedEvent(null)

      await fetchEvents()
    } catch (err: any) {
      console.error(
        'Delete holiday error:',
        err
      )

      toast.error(
        err.response?.data?.message ||
          'Failed to remove holiday'
      )
    }
  }

  /* =========================================================
     ADD COMPANY HOLIDAY
  ========================================================= */

  const handleAddHoliday = async (
    e: FormEvent
  ) => {
    e.preventDefault()

    try {
      await api.post(
        '/erp/holidays',
        holidayForm
      )

      toast.success(
        'Company holiday added'
      )

      setShowHolidayModal(false)

      setHolidayForm({
        title: '',
        date: '',
        endDate: '',
        type: 'Company',
        description: '',
      })

      await fetchEvents()
    } catch (err: any) {
      console.error(
        'Add holiday error:',
        err
      )

      toast.error(
        err.response?.data?.message ||
          'Failed to add holiday'
      )
    }
  }

  /* =========================================================
     EVENT ICON
  ========================================================= */

  const getEventIcon = () => {
    if (!selectedEvent) {
      return 'bx:calendar'
    }

    const type =
      selectedEvent.extendedProps.type

    if (type === 'Project') {
      return 'bx:briefcase'
    }

    if (type === 'Employee Leave') {
      return 'bx:user'
    }

    if (type === 'Invoice Due') {
      return 'bx:receipt'
    }

    if (type === 'Company Holiday') {
      return 'bx:building-house'
    }

    if (
      type === 'Festival / Public Holiday'
    ) {
      return 'bx:party'
    }

    return 'bx:calendar'
  }

  /* =========================================================
     FORMAT DATE
  ========================================================= */

  const formatDate = (
    date?: string
  ) => {
    if (!date) return '-'

    try {
      return new Date(
        date
      ).toLocaleDateString(
        undefined,
        {
          dateStyle: 'long',
        }
      )
    } catch {
      return date
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="p-4">

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <PageHeader
        title="Central ERP Calendar"
        subtitle="Projects, invoices, employee leaves, festivals, and company holidays in one view."
        icon="iconamoon:calendar-1-duotone"
        actions={
          <div className="d-flex gap-2">

            {/* ADD HOLIDAY */}

            {isAdmin && (
              <Button
                variant="primary"
                className="rounded-pill shadow-sm px-3 fw-bold"
                onClick={() =>
                  setShowHolidayModal(true)
                }
              >
                <IconifyIcon
                  icon="bx:plus"
                  className="me-1"
                />

                Add Holiday
              </Button>
            )}

            {/* REFRESH */}

            <Button
              variant="soft-primary"
              className="rounded-pill shadow-sm px-3 fw-bold"
              onClick={fetchEvents}
              disabled={loading}
            >
              <IconifyIcon
                icon="bx:refresh"
                className={`me-1 ${
                  loading
                    ? 'spin-anim'
                    : ''
                }`}
              />

              Sync
            </Button>

          </div>
        }
      />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <Row className="mb-4 g-3">

        {/* ===================================================
            LEGEND
        ==================================================== */}

        <Col md={4} lg={3}>
          <Card className="border-0 shadow-sm rounded-4 p-3 h-100">

            <h6 className="fw-bold text-uppercase text-primary mb-3">
              Calendar Legend
            </h6>

            <div className="d-flex flex-column gap-3">

              {/* PROJECT */}

              <div className="d-flex align-items-center gap-2">

                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor:
                      '#FF4D00',
                  }}
                />

                <div>
                  <strong className="d-block text-dark small">
                    Projects Deadlines
                  </strong>

                  <span className="text-muted fs-11">
                    Due dates for client deliverables
                  </span>
                </div>

              </div>

              {/* APPROVED LEAVES */}

              <div className="d-flex align-items-center gap-2">

                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor:
                      '#198754',
                  }}
                />

                <div>
                  <strong className="d-block text-dark small">
                    Approved Leaves
                  </strong>

                  <span className="text-muted fs-11">
                    Employee out-of-office dates
                  </span>
                </div>

              </div>

              {/* PENDING LEAVES */}

              <div className="d-flex align-items-center gap-2">

                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor:
                      '#ffc107',
                  }}
                />

                <div>
                  <strong className="d-block text-dark small">
                    Pending Leaves
                  </strong>

                  <span className="text-muted fs-11">
                    Leaves awaiting review
                  </span>
                </div>

              </div>

              {/* INVOICE */}

              <div className="d-flex align-items-center gap-2">

                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor:
                      '#dc3545',
                  }}
                />

                <div>
                  <strong className="d-block text-dark small">
                    Invoice Due Dates
                  </strong>

                  <span className="text-muted fs-11">
                    Unpaid billing deadlines
                  </span>
                </div>

              </div>

              {/* COMPANY HOLIDAY */}

              <div className="d-flex align-items-center gap-2">

                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor:
                      '#6f42c1',
                  }}
                />

                <div>
                  <strong className="d-block text-dark small">
                    Company Holidays
                  </strong>

                  <span className="text-muted fs-11">
                    Office/company holidays
                  </span>
                </div>

              </div>

              {/* FESTIVAL */}

              <div className="d-flex align-items-center gap-2">

                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor:
                      '#7c3aed',
                  }}
                />

                <div>
                  <strong className="d-block text-dark small">
                    Festivals / Public Holidays
                  </strong>

                  <span className="text-muted fs-11">
                    Automatically synced holidays
                  </span>
                </div>

              </div>

              {/* WORKING */}

              <div className="d-flex align-items-center gap-2">

                <span
                  className="legend-indicator"
                  style={{
                    backgroundColor:
                      '#6c757d',
                  }}
                />

                <div>
                  <strong className="d-block text-dark small">
                    Working Day
                  </strong>

                  <span className="text-muted fs-11">
                    Holiday overridden as working
                  </span>
                </div>

              </div>

            </div>
          </Card>
        </Col>

        {/* ===================================================
            CALENDAR
        ==================================================== */}

        <Col md={8} lg={9}>

          <Card className="border-0 shadow-sm rounded-4 p-4">

            {loading ? (

              <div className="p-5 text-center">

                <div className="mb-3">
                  <IconifyIcon
                    icon="bx:loader-alt"
                    className="fs-1 text-primary spin-anim"
                  />
                </div>

                <h5 className="text-muted">
                  Loading central calendar schedules...
                </h5>

              </div>

            ) : (

              <div className="fc-wrapper">

             <FullCalendar
  plugins={[
    dayGridPlugin,
    interactionPlugin,
  ]}
  initialView="dayGridMonth"

  // Keep calendar on the month user selected
  initialDate={calendarDateRef.current}

  events={events}

  headerToolbar={{
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek',
  }}

  // Save the currently visible month/date
  datesSet={(dateInfo) => {
    calendarDateRef.current = dateInfo.view.currentStart
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

      {/* =====================================================
          EVENT DETAILS MODAL
      ====================================================== */}

      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false)
          setSelectedEvent(null)
        }}
        centered
        size="lg"
      >

        {selectedEvent && (
          <>

            {/* HEADER */}

            <Modal.Header
              closeButton
              className="border-0 pb-0"
            >

              <Modal.Title
                className="fw-bold text-uppercase fs-15 text-primary d-flex align-items-center"
              >

                <IconifyIcon
                  icon={getEventIcon()}
                  className="me-2"
                />

                {selectedEvent.extendedProps.type}

              </Modal.Title>

            </Modal.Header>

            {/* BODY */}

            <Modal.Body className="p-4">

              {/* TITLE */}

              <div className="d-flex align-items-start justify-content-between gap-3 mb-3">

                <div>

                  <h5 className="fw-bold text-dark mb-1">
                    {selectedEvent.title}
                  </h5>

                  {selectedEvent.extendedProps.localName &&
                    selectedEvent.extendedProps.localName !==
                      selectedEvent.title && (
                      <div className="text-muted small">
                        {
                          selectedEvent
                            .extendedProps
                            .localName
                        }
                      </div>
                    )}

                </div>

                {selectedEvent.extendedProps.status &&
                  renderBadge(
                    selectedEvent
                      .extendedProps
                      .status
                  )}

              </div>

              {/* DATE */}

              <div className="d-flex flex-column gap-2 mb-3">

                <div>

                  <strong className="text-muted small d-block">
                    START DATE:
                  </strong>

                  <span className="text-dark fw-medium">
                    {formatDate(
                      selectedEvent.start
                    )}
                  </span>

                </div>

                {selectedEvent.end && (
                  <div>

                    <strong className="text-muted small d-block">
                      END DATE:
                    </strong>

                    <span className="text-dark fw-medium">
                      {formatDate(
                        selectedEvent.end
                      )}
                    </span>

                  </div>
                )}

              </div>

              <hr />

              {/* =================================================
                  PROJECT
              ================================================== */}

              {selectedEvent.extendedProps.type ===
                'Project' && (

                <div className="d-flex flex-column gap-3">

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      STATUS:
                    </strong>

                    {renderBadge(
                      selectedEvent
                        .extendedProps
                        .status
                    )}

                  </div>

                  {selectedEvent.extendedProps.progress && (
                    <div className="d-flex align-items-center">

                      <strong className="text-muted small w-25">
                        PROGRESS:
                      </strong>

                      <span className="text-primary fw-bold">
                        {
                          selectedEvent
                            .extendedProps
                            .progress
                        }
                      </span>

                    </div>
                  )}

                  <div>

                    <strong className="text-muted small d-block mb-1">
                      DESCRIPTION:
                    </strong>

                    <p className="text-secondary small mb-0 bg-light p-2.5 rounded">
                      {
                        selectedEvent
                          .extendedProps
                          .description ||
                        'No description available.'
                      }
                    </p>

                  </div>

                </div>
              )}

              {/* =================================================
                  EMPLOYEE LEAVE
              ================================================== */}

              {selectedEvent.extendedProps.type ===
                'Employee Leave' && (

                <div className="d-flex flex-column gap-3">

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      EMPLOYEE:
                    </strong>

                    <span className="text-dark fw-bold">
                      {
                        selectedEvent
                          .extendedProps
                          .employeeName ||
                        '-'
                      }
                    </span>

                  </div>

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      ROLE:
                    </strong>

                    <span className="text-secondary small">
                      {
                        selectedEvent
                          .extendedProps
                          .designation ||
                        '-'
                      }
                    </span>

                  </div>

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      LEAVE STATUS:
                    </strong>

                    {renderBadge(
                      selectedEvent
                        .extendedProps
                        .status
                    )}

                  </div>

                  <div>

                    <strong className="text-muted small d-block mb-1">
                      REASON:
                    </strong>

                    <p className="text-secondary small mb-0 bg-light p-2.5 rounded">
                      {
                        selectedEvent
                          .extendedProps
                          .reason ||
                        'No reason provided.'
                      }
                    </p>

                  </div>

                </div>
              )}

              {/* =================================================
                  INVOICE
              ================================================== */}

              {selectedEvent.extendedProps.type ===
                'Invoice Due' && (

                <div className="d-flex flex-column gap-3">

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      INVOICE #:
                    </strong>

                    <span className="text-primary fw-bold">
                      {
                        selectedEvent
                          .extendedProps
                          .invoiceNumber ||
                        '-'
                      }
                    </span>

                  </div>

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      CLIENT:
                    </strong>

                    <span className="text-dark fw-bold">
                      {
                        selectedEvent
                          .extendedProps
                          .client ||
                        '-'
                      }
                    </span>

                  </div>

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      AMOUNT:
                    </strong>

                    <span className="text-danger fw-bold fs-15">
                      {
                        selectedEvent
                          .extendedProps
                          .amount ||
                        '-'
                      }
                    </span>

                  </div>

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      STATUS:
                    </strong>

                    {renderBadge(
                      selectedEvent
                        .extendedProps
                        .status
                    )}

                  </div>

                </div>
              )}

              {/* =================================================
                  COMPANY HOLIDAY
              ================================================== */}

              {selectedEvent.extendedProps.type ===
                'Company Holiday' && (

                <div className="d-flex flex-column gap-3">

                  {/* TYPE */}

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      TYPE:
                    </strong>

                    <Badge
                      bg="light"
                      className="text-primary border"
                    >
                      {
                        selectedEvent
                          .extendedProps
                          .holidayType ||
                        'Company'
                      }
                    </Badge>

                  </div>

                  {/* SOURCE */}

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      SOURCE:
                    </strong>

                    <span className="text-dark">
                      Company
                    </span>

                  </div>

                  {/* STATUS */}

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      STATUS:
                    </strong>

                    <Form.Select
                      size="sm"
                      value={
                        selectedEvent
                          .extendedProps
                          .status ||
                        'Holiday'
                      }
                      disabled={
                        !isAdmin ||
                        updatingHolidayStatus
                      }
                      onChange={(e) => {
                        const newStatus =
                          e.target.value as
                            | 'Holiday'
                            | 'Working'

                        handleHolidayStatusChange(
                          newStatus
                        )
                      }}
                      style={{
                        maxWidth: '180px',
                      }}
                    >
                      <option value="Holiday">
                        Holiday
                      </option>

                      <option value="Working">
                        Working
                      </option>
                    </Form.Select>

                    {updatingHolidayStatus && (
                      <IconifyIcon
                        icon="bx:loader-alt"
                        className="ms-2 text-primary spin-anim"
                      />
                    )}

                  </div>

                  {/* DETAILS */}

                  <div>

                    <strong className="text-muted small d-block mb-1">
                      DETAILS:
                    </strong>

                    <p className="text-secondary small mb-0 bg-light p-2.5 rounded">
                      {
                        selectedEvent
                          .extendedProps
                          .description ||
                        'No details available.'
                      }
                    </p>

                  </div>

                </div>
              )}

              {/* =================================================
                  FESTIVAL / PUBLIC HOLIDAY
              ================================================== */}

              {selectedEvent.extendedProps.type ===
                'Festival / Public Holiday' && (

                <div className="d-flex flex-column gap-3">

                  {/* HOLIDAY TYPE */}

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      TYPE:
                    </strong>

                    <Badge
                      bg="light"
                      className="text-primary border"
                    >
                      {
                        selectedEvent
                          .extendedProps
                          .holidayType ||
                        'Public Holiday'
                      }
                    </Badge>

                  </div>

                  {/* SOURCE */}

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      SOURCE:
                    </strong>

                    <Badge
                      bg="light"
                      className="text-purple border"
                    >
                      Automatic API Sync
                    </Badge>

                  </div>

                  {/* COUNTRY */}

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      COUNTRY:
                    </strong>

                    <span className="text-dark fw-medium">
                      {
                        selectedEvent
                          .extendedProps
                          .countryCode ||
                        'IN'
                      }
                    </span>

                  </div>

                  {/* LOCAL NAME */}

                  {selectedEvent.extendedProps.localName && (
                    <div className="d-flex align-items-center">

                      <strong className="text-muted small w-25">
                        LOCAL NAME:
                      </strong>

                      <span className="text-dark fw-medium">
                        {
                          selectedEvent
                            .extendedProps
                            .localName
                        }
                      </span>

                    </div>
                  )}

                  {/* STATUS */}

                  <div className="d-flex align-items-center">

                    <strong className="text-muted small w-25">
                      STATUS:
                    </strong>

                    <Form.Select
                      size="sm"
                      value={
                        selectedEvent
                          .extendedProps
                          .status ||
                        'Holiday'
                      }
                      disabled={
                        !isAdmin ||
                        updatingHolidayStatus
                      }
                      onChange={(e) => {
                        const newStatus =
                          e.target.value as
                            | 'Holiday'
                            | 'Working'

                        handleHolidayStatusChange(
                          newStatus
                        )
                      }}
                      style={{
                        maxWidth: '180px',
                      }}
                    >
                      <option value="Holiday">
                        Holiday
                      </option>

                      <option value="Working">
                        Working
                      </option>
                    </Form.Select>

                    {updatingHolidayStatus && (
                      <IconifyIcon
                        icon="bx:loader-alt"
                        className="ms-2 text-primary spin-anim"
                      />
                    )}

                  </div>

                  {/* DESCRIPTION */}

                  <div>

                    <strong className="text-muted small d-block mb-1">
                      DETAILS:
                    </strong>

                    <p className="text-secondary small mb-0 bg-light p-2.5 rounded">
                      {
                        selectedEvent
                          .extendedProps
                          .description ||
                        'Automatically synced public/festival holiday.'
                      }
                    </p>

                  </div>

                </div>
              )}

            </Modal.Body>

            {/* FOOTER */}

            <Modal.Footer
              className="border-0 pt-0 justify-content-center"
            >

              {/* DELETE COMPANY HOLIDAY */}

              {isAdmin &&
                selectedEvent.extendedProps.type ===
                  'Company Holiday' && (

                <Button
                  variant="danger"
                  className="rounded-pill px-4"
                  onClick={() =>
                    handleDeleteHoliday(
                      selectedEvent.id
                    )
                  }
                >
                  <IconifyIcon
                    icon="bx:trash"
                    className="me-1"
                  />

                  Remove Holiday
                </Button>
              )}

              <Button
                variant="secondary"
                className="rounded-pill px-4"
                onClick={() => {
                  setShowModal(false)
                  setSelectedEvent(null)
                }}
              >
                Close
              </Button>

            </Modal.Footer>

          </>
        )}

      </Modal>

      {/* =====================================================
          ADD HOLIDAY MODAL
      ====================================================== */}

      <Modal
        show={showHolidayModal}
        onHide={() =>
          setShowHolidayModal(false)
        }
        centered
      >

        <Modal.Header closeButton>

          <Modal.Title className="fw-bold">
            Add Company Holiday
          </Modal.Title>

        </Modal.Header>

        <Form
          onSubmit={handleAddHoliday}
        >

          <Modal.Body>

            {/* HOLIDAY NAME */}

            <Form.Group className="mb-3">

              <Form.Label className="small fw-bold text-muted">
                Holiday Name
              </Form.Label>

              <Form.Control
                required
                placeholder="e.g. Diwali"
                value={
                  holidayForm.title
                }
                onChange={(e) =>
                  setHolidayForm({
                    ...holidayForm,
                    title:
                      e.target.value,
                  })
                }
              />

            </Form.Group>

            {/* DATES */}

            <div className="row g-3 mb-3">

              <div className="col-md-6">

                <Form.Label className="small fw-bold text-muted">
                  Start Date
                </Form.Label>

                <Form.Control
                  type="date"
                  required
                  value={
                    holidayForm.date
                  }
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      date:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="col-md-6">

                <Form.Label className="small fw-bold text-muted">
                  End Date
                </Form.Label>

                <Form.Control
                  type="date"
                  value={
                    holidayForm.endDate
                  }
                  onChange={(e) =>
                    setHolidayForm({
                      ...holidayForm,
                      endDate:
                        e.target.value,
                    })
                  }
                />

              </div>

            </div>

            {/* TYPE */}

            <Form.Group className="mb-3">

              <Form.Label className="small fw-bold text-muted">
                Type
              </Form.Label>

              <Form.Select
                value={
                  holidayForm.type
                }
                onChange={(e) =>
                  setHolidayForm({
                    ...holidayForm,
                    type:
                      e.target.value,
                  })
                }
              >

                <option value="Public">
                  Public Holiday
                </option>

                <option value="Company">
                  Company Holiday
                </option>

                <option value="Optional">
                  Optional Holiday
                </option>

              </Form.Select>

            </Form.Group>

            {/* DESCRIPTION */}

            <Form.Group>

              <Form.Label className="small fw-bold text-muted">
                Description
              </Form.Label>

              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Holiday details..."
                value={
                  holidayForm.description
                }
                onChange={(e) =>
                  setHolidayForm({
                    ...holidayForm,
                    description:
                      e.target.value,
                  })
                }
              />

            </Form.Group>

          </Modal.Body>

          <Modal.Footer>

            <Button
              variant="outline-secondary"
              className="rounded-pill"
              onClick={() =>
                setShowHolidayModal(false)
              }
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              type="submit"
              className="rounded-pill"
            >
              Save Holiday
            </Button>

          </Modal.Footer>

        </Form>

      </Modal>

      {/* =====================================================
          STYLES
      ====================================================== */}

      <style>{`

        .legend-indicator {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          display: inline-block;
          flex-shrink: 0;
        }

        .fs-11 {
          font-size: 11px;
        }

        .fs-15 {
          font-size: 15px;
        }

        .fs-16 {
          font-size: 16px;
        }

        .spin-anim {
          animation: spin 1s linear infinite;
        }

        .p-2\\.5 {
          padding: 10px;
        }

        .text-purple {
          color: #7c3aed !important;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        /* ==============================================
           FULL CALENDAR
        =============================================== */

        .fc {
          font-family: inherit;
        }

        .fc-header-toolbar {
          margin-bottom: 1.5rem !important;
        }

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

        .fc-daygrid-event {
          margin-top: 2px !important;
        }

        .fc-daygrid-more-link {
          font-weight: 600;
        }

        .fc-toolbar-title {
          font-size: 20px !important;
          font-weight: 700 !important;
        }

        /* ==============================================
           MOBILE
        =============================================== */

        @media (max-width: 768px) {

          .fc-toolbar {
            flex-direction: column;
            gap: 10px;
          }

          .fc-toolbar-chunk {
            display: flex;
            justify-content: center;
          }

          .fc-toolbar-title {
            font-size: 17px !important;
          }

          .fc-button-primary {
            padding: 5px 10px !important;
            font-size: 12px !important;
          }

        }

      `}</style>

    </div>
  )
}

export default CalendarPage