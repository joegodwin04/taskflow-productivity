// export.js - Utility for exporting user data to PDF and CSV
import jsPDF from 'jspdf'

export const exportTasksToCSV = (todos) => {
  if (!todos || todos.length === 0) return

  const headers = ['Task', 'Category', 'Priority', 'Status', 'Due Date', 'Completed At', 'Notes']
  const rows = todos.map(t => [
    `"${(t.text || '').replace(/"/g, '""')}"`,
    t.category,
    t.priority,
    t.completed ? 'Completed' : 'Pending',
    t.dueDate || '',
    t.completedAt || '',
    `"${(t.notes || '').replace(/"/g, '""')}"`
  ])

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `taskflow_export_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const generatePDFReport = (user, stats, todos) => {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(22)
  doc.setTextColor(124, 106, 247) // Primary color
  doc.text('TaskFlow Productivity Report', 20, 30)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 40)
  doc.text(`User: ${user?.name || 'Guest'} (${user?.email || 'N/A'})`, 20, 48)
  
  // Stats
  doc.setFontSize(16)
  doc.setTextColor(30, 30, 30)
  doc.text('Performance Summary', 20, 65)
  
  doc.setFontSize(12)
  doc.text(`Total Tasks: ${stats.total}`, 20, 75)
  doc.text(`Completed Tasks: ${stats.completed}`, 20, 83)
  doc.text(`Active Tasks: ${stats.active}`, 20, 91)
  doc.text(`Overdue Tasks: ${stats.overdue}`, 20, 99)
  doc.text(`Completion Rate: ${stats.completionRate}%`, 20, 107)

  // Recent Completed Tasks
  doc.setFontSize(16)
  doc.text('Recent Completed Tasks', 20, 125)
  
  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)
  
  const completedTodos = todos.filter(t => t.completed).slice(0, 10)
  let yPos = 135
  
  if (completedTodos.length === 0) {
    doc.text('No completed tasks yet.', 20, yPos)
  } else {
    completedTodos.forEach((t, i) => {
      const text = `${i + 1}. ${t.text} (${t.priority})`
      // Basic text wrapping if too long
      const lines = doc.splitTextToSize(text, 170)
      doc.text(lines, 20, yPos)
      yPos += (lines.length * 7)
    })
  }
  
  // Footer
  doc.setFontSize(10)
  doc.setTextColor(150, 150, 150)
  doc.text('© TaskFlow Premium Productivity Suite', 20, 280)
  
  doc.save(`taskflow_report_${new Date().toISOString().split('T')[0]}.pdf`)
}
