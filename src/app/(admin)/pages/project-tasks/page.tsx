'use client'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Col, Form, Row, Spinner, Table } from 'react-bootstrap'
import api from '@/helpers/api'
import IconifyIcon from '@/components/wrappers/IconifyIcon'
import { toast } from 'react-toastify'

interface ProjectTask {
  _id: string
  projectName?: string
  title: string
  priority?: string
  assignedToName?: string
  isCompleted?: boolean
  dueDate?: string
}

const ProjectTasksPage = () => {
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'All' | 'Open' | 'Done'>('All')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const res = await api.get('/erp/project-tasks')
      setTasks(res.data || [])
    } catch {
      toast.error('Failed to load project tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'Open') return tasks.filter((t) => !t.isCompleted)
    if (filter === 'Done') return tasks.filter((t) => !!t.isCompleted)
    return tasks
  }, [tasks, filter])

  const priorityColor = (p?: string) => {
    const v = (p || '').toLowerCase()
    if (v === 'high') return 'danger'
    if (v === 'medium') return 'warning'
    if (v === 'low') return 'success'
    return 'secondary'
  }

  return (
    <div className="crm-page">
      <Row className="align-items-end mb-4 g-3">
        <Col>
          <p className="text-muted text-uppercase small fw-bold mb-1">Projects</p>
          <h3 className="fw-bold mb-1">Project Tasks</h3>
          <p className="text-muted mb-0">All tasks across active and completed projects.</p>
        </Col>
        <Col xs="auto">
          <Button variant="soft-secondary" onClick={fetchTasks} disabled={loading}>
            <IconifyIcon icon="bx:refresh" className="me-1" /> Refresh
          </Button>
        </Col>
      </Row>

      <Card className="border-0 mb-3">
        <Card.Body className="py-3">
          <Form.Select style={{ maxWidth: 220 }} value={filter} onChange={(e) => setFilter(e.target.value as any)}>
            <option value="All">All</option>
            <option value="Open">Open</option>
            <option value="Done">Done</option>
          </Form.Select>
        </Card.Body>
      </Card>

      <Card className="border-0 overflow-hidden">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="crm-empty">
              <div className="crm-empty-icon"><IconifyIcon icon="iconamoon:file-check-duotone" /></div>
              <h5 className="fw-bold">No tasks</h5>
              <p className="mb-0">Nothing matches this filter.</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th className="ps-4">Project</th>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task) => (
                  <tr key={task._id}>
                    <td className="ps-4 py-3 text-muted small">{task.projectName || '—'}</td>
                    <td className="fw-semibold">{task.title}</td>
                    <td>
                      <Badge bg={priorityColor(task.priority)} className="rounded-pill px-3">
                        {task.priority || 'Normal'}
                      </Badge>
                    </td>
                    <td>{task.assignedToName || '—'}</td>
                    <td>
                      <Badge bg={task.isCompleted ? 'success' : 'warning'} className="rounded-pill px-3">
                        {task.isCompleted ? 'Done' : 'Open'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default ProjectTasksPage
