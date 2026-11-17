import { useContext } from 'react'
import DataContext from '../contexts/DataContext'

export default function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
