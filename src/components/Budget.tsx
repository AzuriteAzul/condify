import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
  useColorModeValue,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Flex,
  Spacer,
  Select,
  Input,
  FormControl,
  FormLabel,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Tooltip,
  IconButton,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Textarea,
  ModalCloseButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import { FiDownload, FiCalendar, FiDollarSign } from 'react-icons/fi'
import { AddIcon, EditIcon, DeleteIcon, CheckIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { CONFIG, getYearRange, formatCurrency } from '../config'

const MotionBox = motion(Box)

interface BudgetItem {
  id: string
  type: 'income' | 'expense'
  category: string
  description: string
  amount: number
  isRecurring: boolean
  startDate: string
  endDate?: string
  frequency?: 'monthly' | 'quarterly' | 'yearly'
  createdAt: string
  createdBy: string
}

interface PaymentValue {
  id: string
  fraction: string
  amount: number
  last_updated: string
  updated_by: string
}

interface BudgetFormValues {
  type: string
  category: string
  description: string
  amount: number
  isRecurring: string
  startDate: string
  endDate?: string
  frequency?: string
}

const budgetSchema = z.object({
  type: z.string().min(1, 'Tipo é obrigatório'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().min(0, 'Valor deve ser maior ou igual a 0'),
  isRecurring: z.string(),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  endDate: z.string().optional(),
  frequency: z.string().optional(),
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface User {
  email: string
  fraction: string
  is_admin: boolean
}

interface BudgetProps {
  user: User
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const

export default function Budget({ user }: BudgetProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [paymentValues, setPaymentValues] = useState<PaymentValue[]>([])
  const [itemToDelete, setItemToDelete] = useState<BudgetItem | null>(null)
  const [deleteType, setDeleteType] = useState<'all' | 'future'>('all')
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [paymentProofs, setPaymentProofs] = useState<any[]>([])
  const [loadingProofs, setLoadingProofs] = useState(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { 
    isOpen: isEditOpen, 
    onOpen: onEditOpen, 
    onClose: onEditClose 
  } = useDisclosure()
  
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300')
  const textColorMuted = useColorModeValue('gray.500', 'gray.400')
  const cardBg = useColorModeValue('white', 'gray.800')
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      type: 'expense',
      isRecurring: 'false',
    },
  })

  const isRecurring = watch('isRecurring') === 'true'

  // Load payment values from Supabase
  const loadPaymentValues = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_values')
        .select('*')
        .order('fraction', { ascending: true })

      if (error) {
        console.error('Error loading payment values:', error)
        toast({
          title: 'Erro ao carregar valores',
          description: error.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      } else {
        setPaymentValues(data || [])
      }
    } catch (error) {
      console.error('Error loading payment values:', error)
    }
  }

  // Load budget items from Supabase
  const loadBudgetItems = async () => {
    try {
      console.log('🔄 Budget: Starting to load budget items...')
      
      const { data, error } = await supabase
        .from('budget_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading budget items:', error)
        toast({
          title: 'Erro ao carregar itens',
          description: 'Não foi possível carregar os itens do orçamento.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      console.log('📊 Budget: Found', data?.length || 0, 'budget items')
      
      // Convert database format to component format
      const items: BudgetItem[] = (data || []).map(item => ({
        id: item.id,
        type: item.type,
        category: item.category,
        description: item.description,
        amount: item.amount,
        isRecurring: item.is_recurring,
        startDate: item.start_date,
        endDate: item.end_date,
        frequency: item.frequency,
        createdAt: item.created_at,
        createdBy: item.created_by,
      }))
      
      console.log('🔄 Budget: Converted', items.length, 'items to component format')
      setBudgetItems(items)
    } catch (error) {
      console.error('Error loading budget items:', error)
    }
  }

  // Load payment proofs from Supabase
  const loadPaymentProofs = async () => {
    try {
      setLoadingProofs(true)
      console.log('🔄 Budget: Starting to load payment proofs...')
      
      // Only select necessary fields, exclude file_url to prevent timeout
      const { data, error } = await supabase
        .from('payment_proofs')
        .select('id, fraction, month, year, file_name, file_type, file_size, uploaded_by, uploaded_at')
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error loading payment proofs:', error)
        toast({
          title: 'Erro ao carregar comprovativos',
          description: 'Não foi possível carregar os comprovativos de pagamento.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }

      console.log('📊 Budget: Found', data?.length || 0, 'payment proofs')
      setPaymentProofs(data || [])
    } catch (error) {
      console.error('Error loading payment proofs:', error)
    } finally {
      setLoadingProofs(false)
    }
  }

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([loadPaymentValues(), loadBudgetItems(), loadPaymentProofs()])
      toast({
        title: 'Dados atualizados',
        description: 'Os dados foram atualizados com sucesso.',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Listen for data changes (poll every 5 seconds for updates)
  useEffect(() => {
    // Initial load
    loadPaymentValues()
    loadBudgetItems()
    loadPaymentProofs()
    fixExistingIncomeItems() // Fix any existing income items with incorrect dates
    
    const interval = setInterval(() => {
      loadPaymentValues()
      loadBudgetItems()
      loadPaymentProofs()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Listen for localStorage changes (when items are added from QuoteMap)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedItems = localStorage.getItem('budgetItems')
      if (storedItems) {
        try {
          const newItems = JSON.parse(storedItems)
          setBudgetItems(newItems)
        } catch (error) {
          console.error('Error parsing budget items from localStorage:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Set initial month and year to June 2025 if current date is before that
  useEffect(() => {
    const now = new Date()
    const condominiumStartDate = CONFIG.CONDOMINIUM_START_DATE
    
    if (now < condominiumStartDate) {
      setSelectedMonth(condominiumStartDate.getMonth())
      setSelectedYear(condominiumStartDate.getFullYear())
    } else {
      setSelectedMonth(now.getMonth())
      setSelectedYear(now.getFullYear())
    }
  }, [])

  const getItemsForMonth = (month: number, year: number) => {
    const condominiumStartDate = CONFIG.CONDOMINIUM_START_DATE
    
    const filteredItems = budgetItems.filter(item => {
      const itemStartDate = new Date(item.startDate)
      
      // Skip items before condominium start date
      if (itemStartDate < condominiumStartDate) {
        return false
      }
      
      const itemStartMonth = itemStartDate.getMonth()
      const itemStartYear = itemStartDate.getFullYear()
      
      if (item.isRecurring) {
        // Check if item has an end date and if current month is after the end date
        if (item.endDate) {
          const itemEndDate = new Date(item.endDate)
          const currentMonthStart = new Date(year, month, 1) // First day of current month
          
          console.log(`🔍 Checking recurring item "${item.description}":`, {
            currentMonth: month,
            currentYear: year,
            currentMonthStart: currentMonthStart.toISOString(),
            itemEndDate: item.endDate,
            itemEndDateObj: itemEndDate.toISOString(),
            shouldExclude: itemEndDate < currentMonthStart
          })
          
          // If the end date is before the start of the current month, don't include this item
          if (itemEndDate < currentMonthStart) {
            console.log(`❌ Excluding item "${item.description}" - end date is before current month`)
            return false
          }
        }
        
        if (item.frequency === 'monthly') {
          return itemStartYear < year || (itemStartYear === year && itemStartMonth <= month)
        } else if (item.frequency === 'quarterly') {
          const quarter = Math.floor(month / 3)
          const startQuarter = Math.floor(itemStartMonth / 3)
          return itemStartYear < year || (itemStartYear === year && startQuarter <= quarter)
        } else if (item.frequency === 'yearly') {
          return itemStartYear <= year
        }
      } else {
        const endDate = item.endDate ? new Date(item.endDate) : itemStartDate
        const endMonth = endDate.getMonth()
        const endYear = endDate.getFullYear()
        
        return (itemStartYear === year && itemStartMonth === month) ||
               (endYear === year && endMonth === month) ||
               (itemStartYear < year && endYear > year) ||
               (itemStartYear === year && endYear === year && itemStartMonth <= month && endMonth >= month)
      }
      return false
    })
    
    console.log(`🔍 Budget: Filtering items for ${month}/${year}, found ${filteredItems.length} items out of ${budgetItems.length} total`)
    return filteredItems
  }

  const calculateMonthlyTotals = (month: number, year: number) => {
    const items = getItemsForMonth(month, year)
    const income = items.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0)
    const expenses = items.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0)
    return { income, expenses, balance: income - expenses }
  }

  const onSubmit = async (data: BudgetFormValues) => {
    try {
      // Save to Supabase database
      const { data: newItemData, error } = await supabase
        .from('budget_items')
        .insert([
          {
            type: data.type as 'income' | 'expense',
            category: data.category,
            description: data.description,
            amount: data.amount,
            is_recurring: data.isRecurring === 'true',
            start_date: data.startDate,
            end_date: data.endDate || null,
            frequency: data.isRecurring === 'true' ? (data.frequency as 'monthly' | 'quarterly' | 'yearly') : null,
            created_by: user.email,
          }
        ])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      // Create item object for local state
      const newItem: BudgetItem = {
        id: newItemData.id,
        type: newItemData.type,
        category: newItemData.category,
        description: newItemData.description,
        amount: newItemData.amount,
        isRecurring: newItemData.is_recurring,
        startDate: newItemData.start_date,
        endDate: newItemData.end_date,
        frequency: newItemData.frequency,
        createdAt: newItemData.created_at,
        createdBy: newItemData.created_by,
      }

      // Add to local state
      setBudgetItems(prev => [newItem, ...prev])
      
      toast({
        title: 'Item adicionado',
        description: 'O item foi adicionado ao orçamento com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onClose()
      reset()

      addActivityLog('budget_created', `Item adicionado ao orçamento: ${data.category} - ${data.description}`, newItem.id)
    } catch (error) {
      console.error('Error creating budget item:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao adicionar o item.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleEditItem = (item: BudgetItem) => {
    // Prevent editing of income items from payment proofs
    if (isFromPaymentProof(item)) {
      toast({
        title: 'Não é possível editar',
        description: 'Este item de receita foi gerado automaticamente a partir de um comprovativo de pagamento. Para o modificar, edite o comprovativo na página de Mapa de Quotas.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    setEditingItem(item)
    setValue('type', item.type)
    setValue('category', item.category)
    setValue('description', item.description)
    setValue('amount', item.amount)
    setValue('isRecurring', item.isRecurring ? 'true' : 'false')
    setValue('startDate', new Date(item.startDate).toISOString().split('T')[0])
    if (item.endDate) {
      setValue('endDate', new Date(item.endDate).toISOString().split('T')[0])
    }
    if (item.frequency) {
      setValue('frequency', item.frequency)
    }
    onOpen()

    addActivityLog('budget_updated', `Item editado no orçamento: ${item.category} - ${item.description}`, item.id)
  }

  const onEditSubmit = async (data: BudgetFormValues) => {
    try {
      if (!editingItem) return

      // Update in Supabase database
      const { error } = await supabase
        .from('budget_items')
        .update({
          type: data.type as 'income' | 'expense',
          category: data.category,
          description: data.description,
          amount: data.amount,
          is_recurring: data.isRecurring === 'true',
          start_date: data.startDate,
          end_date: data.endDate || null,
          frequency: data.isRecurring === 'true' ? (data.frequency as 'monthly' | 'quarterly' | 'yearly') : null,
        })
        .eq('id', editingItem.id)

      if (error) {
        throw new Error(error.message)
      }

      // Update local state
      const updatedItem: BudgetItem = {
        ...editingItem,
        type: data.type as 'income' | 'expense',
        category: data.category,
        description: data.description,
        amount: data.amount,
        isRecurring: data.isRecurring === 'true',
        startDate: data.startDate,
        endDate: data.endDate || undefined,
        frequency: data.isRecurring === 'true' ? (data.frequency as 'monthly' | 'quarterly' | 'yearly') : undefined,
      }

      setBudgetItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item))
      
      toast({
        title: 'Item atualizado',
        description: 'O item foi atualizado com sucesso.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      
      onEditClose()
      setEditingItem(null)
      reset()

      addActivityLog('budget_updated', `Item atualizado no orçamento: ${data.category} - ${data.description}`, updatedItem.id)
    } catch (error) {
      console.error('Error updating budget item:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar o item.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleDeleteItem = async (id: string) => {
    const item = budgetItems.find(item => item.id === id)
    
    if (!item) return
    
    // Prevent deletion of income items from payment proofs
    if (isFromPaymentProof(item)) {
      toast({
        title: 'Não é possível eliminar',
        description: 'Este item de receita foi gerado automaticamente a partir de um comprovativo de pagamento. Para o eliminar, remova o comprovativo na página de Mapa de Quotas.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      return
    }

    // Set the item to delete and show confirmation dialog
    setItemToDelete(item)
    setDeleteType('all') // Default to 'all' for non-recurring items
  }

  const performDeleteItem = async (item: BudgetItem, deleteType: 'all' | 'future') => {
    try {
      console.log('🔍 Delete operation:', { deleteType, item: item.description, isRecurring: item.isRecurring })
      
      if (deleteType === 'all') {
        // Delete all instances of this recurring item
        if (item.isRecurring) {
          // Find all recurring items with the same description, category, and type
          const allInstances = budgetItems.filter(budgetItem => 
            budgetItem.description === item.description &&
            budgetItem.category === item.category &&
            budgetItem.type === item.type &&
            budgetItem.isRecurring === true
          )
          
          // Delete all instances from Supabase
          for (const instance of allInstances) {
            const { error } = await supabase
              .from('budget_items')
              .delete()
              .eq('id', instance.id)

            if (error) {
              throw new Error(error.message)
            }
          }

          // Remove from local state
          setBudgetItems(prev => prev.filter(budgetItem => !allInstances.some(instance => instance.id === budgetItem.id)))
          
          toast({
            title: 'Itens eliminados',
            description: `Todas as instâncias deste item recorrente foram eliminadas com sucesso.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } else {
          // For non-recurring items, just delete the item
          const { error } = await supabase
            .from('budget_items')
            .delete()
            .eq('id', item.id)

          if (error) {
            throw new Error(error.message)
          }

          // Remove from local state
          setBudgetItems(prev => prev.filter(budgetItem => budgetItem.id !== item.id))
          
          toast({
            title: 'Item eliminado',
            description: 'O item foi eliminado com sucesso.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }
      } else if (deleteType === 'future') {
        // Delete this specific month and all future months
        if (item.isRecurring) {
          // For recurring items, we need to modify the end date to end before the current month
          const currentDate = new Date(selectedYear, selectedMonth, 1)
          const itemStartDate = new Date(item.startDate)
          
          if (itemStartDate >= currentDate) {
            // If the item starts in or after current month, delete it entirely
            const { error } = await supabase
              .from('budget_items')
              .delete()
              .eq('id', item.id)

            if (error) {
              throw new Error(error.message)
            }

            // Remove from local state
            setBudgetItems(prev => prev.filter(budgetItem => budgetItem.id !== item.id))
            
            toast({
              title: 'Item eliminado',
              description: 'O item foi eliminado com sucesso.',
              status: 'success',
              duration: 3000,
              isClosable: true,
            })
          } else {
            // If the item starts before current month, modify its end date
            const endDateBefore = new Date(selectedYear, selectedMonth, 0) // Last day of previous month
            
            const { error } = await supabase
              .from('budget_items')
              .update({ end_date: endDateBefore.toISOString() })
              .eq('id', item.id)

            if (error) {
              throw new Error(error.message)
            }

            // Update local state
            setBudgetItems(prev => prev.map(budgetItem => 
              budgetItem.id === item.id 
                ? { ...budgetItem, endDate: endDateBefore.toISOString() }
                : budgetItem
            ))
            
            toast({
              title: 'Item eliminados',
              description: 'As instâncias deste mês e futuros, deste item recorrente, foram eliminadas com sucesso.',
              status: 'success',
              duration: 3000,
              isClosable: true,
            })
          }
        } else {
          // For non-recurring items, just delete the item
          const { error } = await supabase
            .from('budget_items')
            .delete()
            .eq('id', item.id)

          if (error) {
            throw new Error(error.message)
          }

          // Remove from local state
          setBudgetItems(prev => prev.filter(budgetItem => budgetItem.id !== item.id))
          
          toast({
            title: 'Item eliminado',
            description: 'O item foi eliminado com sucesso.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        }
      }

      addActivityLog('budget_deleted', `Item(s) eliminado(s) do orçamento: ${item.category} - ${item.description} (${deleteType})`, item.id)
    } catch (error) {
      console.error('Error deleting budget item:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao eliminar o item.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const currentTotals = calculateMonthlyTotals(selectedMonth, selectedYear)
  const currentItems = getItemsForMonth(selectedMonth, selectedYear)

  // Check if an income item is from a payment proof
  const isFromPaymentProof = (item: BudgetItem) => {
    return item.category === 'Quotas' && item.description.includes('Pagamento de quotas - Fração')
  }

  const addActivityLog = (type: 'budget_created' | 'budget_deleted' | 'budget_updated', description: string, itemId?: string) => {
    const storedLogs = localStorage.getItem('activityLogs')
    const logs = storedLogs ? JSON.parse(storedLogs) : []
    
    const newLog = {
      id: Date.now().toString(),
      type,
      description,
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      itemId
    }
    
    logs.unshift(newLog) // Add to beginning
    localStorage.setItem('activityLogs', JSON.stringify(logs))
  }

  // Fix existing income items with incorrect dates
  const fixExistingIncomeItems = async () => {
    try {
      console.log('Checking for income items with incorrect dates...')
      
      // Get all income items
      const { data: incomeItems, error } = await supabase
        .from('budget_items')
        .select('*')
        .eq('type', 'income')
        .eq('category', 'Quotas')

      if (error) {
        console.error('Error fetching income items:', error)
        return
      }

      console.log('Found income items:', incomeItems)

      // Check each item and fix if needed
      for (const item of incomeItems || []) {
        const itemStartDate = new Date(item.start_date)
        const condominiumStartDate = CONFIG.CONDOMINIUM_START_DATE
        
        console.log('Checking item:', item.description, 'start date:', itemStartDate, 'vs condominium start:', condominiumStartDate)
        
        // If the item is before the condominium start date, it needs to be fixed
        if (itemStartDate < condominiumStartDate) {
          console.log('Fixing item:', item.description)
          
          // Extract month and year from the description
          const match = item.description.match(/\(([^)]+)\)/)
          if (match) {
            const monthYear = match[1] // e.g., "Junho 2025"
            const monthMatch = monthYear.match(/(\w+)\s+(\d{4})/)
            
            if (monthMatch) {
              const monthName = monthMatch[1]
              const year = parseInt(monthMatch[2])
              
              // Convert month name to number
              const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
              const month = months.indexOf(monthName)
              
              if (month !== -1) {
                // Update with correct UTC date
                const correctStartDate = new Date(Date.UTC(year, month, 1)).toISOString()
                
                console.log('Updating item with correct date:', correctStartDate)
                
                const { error: updateError } = await supabase
                  .from('budget_items')
                  .update({
                    start_date: correctStartDate,
                    end_date: correctStartDate
                  })
                  .eq('id', item.id)

                if (updateError) {
                  console.error('Error updating item:', updateError)
                } else {
                  console.log('Successfully updated item:', item.description)
                }
              }
            }
          }
        }
      }
      
      // Reload budget items after fixing
      await loadBudgetItems()
      
    } catch (error) {
      console.error('Error fixing income items:', error)
    }
  }

  return (
    <Container maxW="container.xl" py={8} pb={32}>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        mb={8}
      >
        {/* Header */}
        <Flex justify="space-between" align="center" mb={6}>
          <Box>
            <Heading size="2xl" color={textColor} mb={2}>
              💰 Orçamento
            </Heading>
            <Text fontSize="lg" color={textColorSecondary}>
              Gestão financeira do condomínio
            </Text>
          </Box>
          <HStack spacing={3}>
            {user.is_admin && (
              <Button
                leftIcon={<AddIcon />}
                colorScheme="blue"
                size={{ base: "sm", md: "md" }}
                onClick={onOpen}
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
                borderRadius="lg"
              >
                Novo
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Month/Year Selector */}
        <Card
          bg={cardBg}
          borderWidth="1px"
          borderColor={cardBorderColor}
          _hover={{ boxShadow: 'md' }}
          transition="all 0.2s"
          mb={6}
        >
          <CardBody>
            <HStack spacing={4} justify="center">
              <FormControl maxW="200px">
                <FormLabel fontSize="sm" fontWeight="medium" color={textColorSecondary}>Mês</FormLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  borderColor="gray.300"
                  _hover={{ borderColor: 'blue.400' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                >
                  {months.map((month, index) => (
                    <option key={month} value={index}>
                      {month}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl maxW="120px">
                <FormLabel fontSize="sm" fontWeight="medium" color={textColorSecondary}>Ano</FormLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  borderColor="gray.300"
                  _hover={{ borderColor: 'blue.400' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                >
                  {getYearRange().map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </HStack>
          </CardBody>
        </Card>

        {/* Stats Grid */}
        <Grid templateColumns={{ base: "repeat(1, 1fr)", md: "repeat(3, 1fr)" }} gap={6} mb={8}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorderColor}
              _hover={{ borderColor: 'green.300', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              <CardBody>
                <Stat>
                  <StatLabel color={textColorSecondary} fontSize="sm" fontWeight="medium">Receitas</StatLabel>
                  <StatNumber color="green.500" fontSize="2xl" fontWeight="bold">
                    {formatCurrency(currentTotals.income)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Receitas do mês
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorderColor}
              _hover={{ borderColor: 'red.300', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              <CardBody>
                <Stat>
                  <StatLabel color={textColorSecondary} fontSize="sm" fontWeight="medium">Despesas</StatLabel>
                  <StatNumber color="red.500" fontSize="2xl" fontWeight="bold">
                    {formatCurrency(currentTotals.expenses)}
                  </StatNumber>
                  <StatHelpText>
                    <StatArrow type="decrease" />
                    Despesas do mês
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
          >
            <Card
              bg={cardBg}
              borderWidth="1px"
              borderColor={cardBorderColor}
              _hover={{ borderColor: currentTotals.balance >= 0 ? 'green.300' : 'red.300', boxShadow: 'lg' }}
              transition="all 0.2s"
            >
              <CardBody>
                <Stat>
                  <StatLabel color={textColorSecondary} fontSize="sm" fontWeight="medium">Saldo</StatLabel>
                  <StatNumber color={currentTotals.balance >= 0 ? 'green.500' : 'red.500'} fontSize="2xl" fontWeight="bold">
                    {formatCurrency(currentTotals.balance)}
                  </StatNumber>
                  <StatHelpText>
                    {currentTotals.balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </MotionBox>
        </Grid>
      </MotionBox>

      {/* Tabs */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Tabs variant="soft-rounded" colorScheme="blue">
          <TabList mb={6}>
            <Tab>📈 Receitas</Tab>
            <Tab>📉 Despesas</Tab>
            <Tab>📊 Todos os Itens</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <VStack spacing={4} align="stretch">
                {currentItems
                  .filter(item => item.type === 'income')
                  .map((item) => (
                    <MotionBox
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={cardBorderColor}
                        _hover={{ borderColor: 'green.300', boxShadow: 'lg' }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={2} flex={1}>
                              <HStack spacing={3}>
                                <Badge colorScheme="green" variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                  {item.category}
                                </Badge>
                                {isFromPaymentProof(item) && (
                                  <Badge colorScheme="purple" variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                    <HStack spacing={1}>
                                      <Icon as={CheckIcon} boxSize={3} />
                                      <Text>Comprovativo</Text>
                                    </HStack>
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontWeight="semibold" color={textColor}>
                                {item.description}
                              </Text>
                              <HStack spacing={4} color={textColorSecondary} fontSize="sm">
                                <HStack spacing={1}>
                                  <Icon as={FiDollarSign} />
                                  <Text fontWeight="bold" color="green.500">
                                    {formatCurrency(item.amount)}
                                  </Text>
                                </HStack>
                                <Badge colorScheme={item.isRecurring ? 'green' : 'blue'} variant="subtle" fontSize="xs">
                                  {item.isRecurring ? 'Recorrente' : 'Único'}
                                </Badge>
                                <HStack spacing={1}>
                                  <Icon as={FiCalendar} />
                                  <Text>
                                    {item.isRecurring ? (
                                      `${item.frequency === 'monthly' ? 'Mensal' : 
                                        item.frequency === 'quarterly' ? 'Trimestral' : 'Anual'}`
                                    ) : (
                                      `${new Date(item.startDate).toLocaleDateString('pt-PT')}${item.endDate ? ` - ${new Date(item.endDate).toLocaleDateString('pt-PT')}` : ''}`
                                    )}
                                  </Text>
                                </HStack>
                              </HStack>
                            </VStack>
                            {user.is_admin && (
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Edit item"
                                  icon={<EditIcon />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                  isDisabled={isFromPaymentProof(item)}
                                  onClick={() => handleEditItem(item)}
                                  _hover={{ bg: hoverBg }}
                                />
                                <IconButton
                                  aria-label="Delete item"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  isDisabled={isFromPaymentProof(item)}
                                  onClick={() => handleDeleteItem(item.id)}
                                  _hover={{ bg: hoverBg }}
                                />
                              </HStack>
                            )}
                          </Flex>
                        </CardBody>
                      </Card>
                    </MotionBox>
                  ))}
                {currentItems.filter(item => item.type === 'income').length === 0 && (
                  <Center py={12}>
                    <VStack spacing={3}>
                      <Box fontSize="4xl">📈</Box>
                      <Text color={textColorMuted} fontSize="lg">
                        Nenhuma receita encontrada
                      </Text>
                      <Text color={textColorMuted} fontSize="sm">
                        Adicione receitas para este mês
                      </Text>
                    </VStack>
                  </Center>
                )}
              </VStack>
            </TabPanel>

            <TabPanel p={0}>
              <VStack spacing={4} align="stretch">
                {currentItems
                  .filter(item => item.type === 'expense')
                  .map((item) => (
                    <MotionBox
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        bg={cardBg}
                        borderWidth="1px"
                        borderColor={cardBorderColor}
                        _hover={{ borderColor: 'red.300', boxShadow: 'lg' }}
                        transition="all 0.2s"
                      >
                        <CardBody>
                          <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={2} flex={1}>
                              <Badge colorScheme="red" variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                {item.category}
                              </Badge>
                              <Text fontWeight="semibold" color={textColor}>
                                {item.description}
                              </Text>
                              <HStack spacing={4} color={textColorSecondary} fontSize="sm">
                                <HStack spacing={1}>
                                  <Icon as={FiDollarSign} />
                                  <Text fontWeight="bold" color="red.500">
                                    {formatCurrency(item.amount)}
                                  </Text>
                                </HStack>
                                <Badge colorScheme={item.isRecurring ? 'green' : 'blue'} variant="subtle" fontSize="xs">
                                  {item.isRecurring ? 'Recorrente' : 'Único'}
                                </Badge>
                                <HStack spacing={1}>
                                  <Icon as={FiCalendar} />
                                  <Text>
                                    {item.isRecurring ? (
                                      `${item.frequency === 'monthly' ? 'Mensal' : 
                                        item.frequency === 'quarterly' ? 'Trimestral' : 'Anual'}`
                                    ) : (
                                      `${new Date(item.startDate).toLocaleDateString('pt-PT')}${item.endDate ? ` - ${new Date(item.endDate).toLocaleDateString('pt-PT')}` : ''}`
                                    )}
                                  </Text>
                                </HStack>
                              </HStack>
                            </VStack>
                            {user.is_admin && (
                              <HStack spacing={2}>
                                <IconButton
                                  aria-label="Edit item"
                                  icon={<EditIcon />}
                                  size="sm"
                                  colorScheme="blue"
                                  variant="ghost"
                                  onClick={() => handleEditItem(item)}
                                  _hover={{ bg: hoverBg }}
                                />
                                <IconButton
                                  aria-label="Delete item"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={() => handleDeleteItem(item.id)}
                                  _hover={{ bg: hoverBg }}
                                />
                              </HStack>
                            )}
                          </Flex>
                        </CardBody>
                      </Card>
                    </MotionBox>
                  ))}
                {currentItems.filter(item => item.type === 'expense').length === 0 && (
                  <Center py={12}>
                    <VStack spacing={3}>
                      <Box fontSize="4xl">📉</Box>
                      <Text color={textColorMuted} fontSize="lg">
                        Nenhuma despesa encontrada
                      </Text>
                      <Text color={textColorMuted} fontSize="sm">
                        Adicione despesas para este mês
                      </Text>
                    </VStack>
                  </Center>
                )}
              </VStack>
            </TabPanel>

            <TabPanel p={0}>
              <VStack spacing={4} align="stretch">
                {currentItems.map((item) => (
                  <MotionBox
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card
                      bg={cardBg}
                      borderWidth="1px"
                      borderColor={cardBorderColor}
                      _hover={{ 
                        borderColor: item.type === 'income' ? 'green.300' : 'red.300', 
                        boxShadow: 'lg' 
                      }}
                      transition="all 0.2s"
                    >
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={2} flex={1}>
                            <HStack spacing={3}>
                              <Badge 
                                colorScheme={item.type === 'income' ? 'green' : 'red'} 
                                variant="subtle" 
                                fontSize="sm" 
                                px={3} 
                                py={1} 
                                borderRadius="full"
                              >
                                {item.category}
                              </Badge>
                              {item.type === 'income' && isFromPaymentProof(item) && (
                                <Badge colorScheme="purple" variant="subtle" fontSize="sm" px={3} py={1} borderRadius="full">
                                  <HStack spacing={1}>
                                    <Icon as={CheckIcon} boxSize={3} />
                                    <Text>Comprovativo</Text>
                                  </HStack>
                                </Badge>
                              )}
                            </HStack>
                            <Text fontWeight="semibold" color={textColor}>
                              {item.description}
                            </Text>
                            <HStack spacing={4} color={textColorSecondary} fontSize="sm">
                              <HStack spacing={1}>
                                <Icon as={FiDollarSign} />
                                <Text fontWeight="bold" color={item.type === 'income' ? 'green.500' : 'red.500'}>
                                  {formatCurrency(item.amount)}
                                </Text>
                              </HStack>
                              <Badge colorScheme={item.isRecurring ? 'green' : 'blue'} variant="subtle" fontSize="xs">
                                {item.isRecurring ? 'Recorrente' : 'Único'}
                              </Badge>
                              <HStack spacing={1}>
                                <Icon as={FiCalendar} />
                                <Text>
                                  {item.isRecurring ? (
                                    `${item.frequency === 'monthly' ? 'Mensal' : 
                                      item.frequency === 'quarterly' ? 'Trimestral' : 'Anual'}`
                                  ) : (
                                    `${new Date(item.startDate).toLocaleDateString('pt-PT')}${item.endDate ? ` - ${new Date(item.endDate).toLocaleDateString('pt-PT')}` : ''}`
                                  )}
                                </Text>
                              </HStack>
                            </HStack>
                          </VStack>
                          {user.is_admin && (
                            <HStack spacing={2}>
                              <IconButton
                                aria-label="Edit item"
                                icon={<EditIcon />}
                                size="sm"
                                colorScheme="blue"
                                variant="ghost"
                                isDisabled={item.type === 'income' && isFromPaymentProof(item)}
                                onClick={() => handleEditItem(item)}
                                _hover={{ bg: hoverBg }}
                              />
                              <IconButton
                                aria-label="Delete item"
                                icon={<DeleteIcon />}
                                size="sm"
                                colorScheme="red"
                                variant="ghost"
                                isDisabled={item.type === 'income' && isFromPaymentProof(item)}
                                onClick={() => handleDeleteItem(item.id)}
                                _hover={{ bg: hoverBg }}
                              />
                            </HStack>
                          )}
                        </Flex>
                      </CardBody>
                    </Card>
                  </MotionBox>
                ))}
                {currentItems.length === 0 && (
                  <Center py={12}>
                    <VStack spacing={3}>
                      <Box fontSize="4xl">📊</Box>
                      <Text color={textColorMuted} fontSize="lg">
                        Nenhum item encontrado
                      </Text>
                      <Text color={textColorMuted} fontSize="sm">
                        Adicione itens para este mês
                      </Text>
                    </VStack>
                  </Center>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </MotionBox>

      {/* Add Item Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Novo Item</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.type}>
                  <FormLabel>Tipo</FormLabel>
                  <Select {...register('type')}>
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </Select>
                  {errors.type && (
                    <Text color="red.500" fontSize="sm">
                      {errors.type.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.category}>
                  <FormLabel>Categoria</FormLabel>
                  <Input
                    {...register('category')}
                    placeholder="Ex: Limpeza, Manutenção, Quotas"
                  />
                  {errors.category && (
                    <Text color="red.500" fontSize="sm">
                      {errors.category.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.description}>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea
                    {...register('description')}
                    placeholder="Descrição detalhada do item"
                  />
                  {errors.description && (
                    <Text color="red.500" fontSize="sm">
                      {errors.description.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.amount}>
                  <FormLabel>Valor (€)</FormLabel>
                  <Input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <Text color="red.500" fontSize="sm">
                      {errors.amount.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.isRecurring}>
                  <FormLabel>Tipo de Item</FormLabel>
                  <Select {...register('isRecurring')}>
                    <option value="false">Item Único</option>
                    <option value="true">Item Recorrente</option>
                  </Select>
                  {errors.isRecurring && (
                    <Text color="red.500" fontSize="sm">
                      {errors.isRecurring.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.startDate}>
                  <FormLabel>Data de Início</FormLabel>
                  <Input
                    {...register('startDate')}
                    type="date"
                  />
                  {errors.startDate && (
                    <Text color="red.500" fontSize="sm">
                      {errors.startDate.message}
                    </Text>
                  )}
                </FormControl>

                {!isRecurring && (
                  <FormControl isInvalid={!!errors.endDate}>
                    <FormLabel>Data de Fim (Opcional)</FormLabel>
                    <Input
                      {...register('endDate')}
                      type="date"
                    />
                    {errors.endDate && (
                      <Text color="red.500" fontSize="sm">
                        {errors.endDate.message}
                      </Text>
                    )}
                  </FormControl>
                )}

                {isRecurring && (
                  <FormControl isInvalid={!!errors.frequency}>
                    <FormLabel>Frequência</FormLabel>
                    <Select {...register('frequency')}>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </Select>
                    {errors.frequency && (
                      <Text color="red.500" fontSize="sm">
                        {errors.frequency.message}
                      </Text>
                    )}
                  </FormControl>
                )}

                <Button
                  type="submit"
                  colorScheme="blue"
                  size={{ base: "md", md: "lg" }}
                  width="full"
                  isLoading={isSubmitting}
                  loadingText="A adicionar..."
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  transition="all 0.2s"
                >
                  Adicionar
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Editar Item do Orçamento</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmit(onEditSubmit)}>
              <VStack spacing={4}>
                <FormControl isInvalid={!!errors.type}>
                  <FormLabel>Tipo</FormLabel>
                  <Select {...register('type')}>
                    <option value="income">Receita</option>
                    <option value="expense">Despesa</option>
                  </Select>
                  {errors.type && (
                    <Text color="red.500" fontSize="sm">
                      {errors.type.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.category}>
                  <FormLabel>Categoria</FormLabel>
                  <Input
                    {...register('category')}
                    placeholder="Ex: Limpeza, Manutenção, Quotas"
                  />
                  {errors.category && (
                    <Text color="red.500" fontSize="sm">
                      {errors.category.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.description}>
                  <FormLabel>Descrição</FormLabel>
                  <Textarea
                    {...register('description')}
                    placeholder="Descrição detalhada do item"
                  />
                  {errors.description && (
                    <Text color="red.500" fontSize="sm">
                      {errors.description.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.amount}>
                  <FormLabel>Valor (€)</FormLabel>
                  <Input
                    {...register('amount', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  {errors.amount && (
                    <Text color="red.500" fontSize="sm">
                      {errors.amount.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.isRecurring}>
                  <FormLabel>Tipo de Item</FormLabel>
                  <Select {...register('isRecurring')}>
                    <option value="false">Item Único</option>
                    <option value="true">Item Recorrente</option>
                  </Select>
                  {errors.isRecurring && (
                    <Text color="red.500" fontSize="sm">
                      {errors.isRecurring.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.startDate}>
                  <FormLabel>Data de Início</FormLabel>
                  <Input
                    {...register('startDate')}
                    type="date"
                  />
                  {errors.startDate && (
                    <Text color="red.500" fontSize="sm">
                      {errors.startDate.message}
                    </Text>
                  )}
                </FormControl>

                {!isRecurring && (
                  <FormControl isInvalid={!!errors.endDate}>
                    <FormLabel>Data de Fim (Opcional)</FormLabel>
                    <Input
                      {...register('endDate')}
                      type="date"
                    />
                    {errors.endDate && (
                      <Text color="red.500" fontSize="sm">
                        {errors.endDate.message}
                      </Text>
                    )}
                  </FormControl>
                )}

                {isRecurring && (
                  <FormControl isInvalid={!!errors.frequency}>
                    <FormLabel>Frequência</FormLabel>
                    <Select {...register('frequency')}>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </Select>
                    {errors.frequency && (
                      <Text color="red.500" fontSize="sm">
                        {errors.frequency.message}
                      </Text>
                    )}
                  </FormControl>
                )}

                <Button
                  type="submit"
                  colorScheme="blue"
                  size={{ base: "md", md: "lg" }}
                  width="full"
                  isLoading={isSubmitting}
                  loadingText="A atualizar..."
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                  transition="all 0.2s"
                >
                  Atualizar
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        isOpen={!!itemToDelete} 
        onClose={() => setItemToDelete(null)} 
        leastDestructiveRef={cancelRef}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Item do Orçamento
            </AlertDialogHeader>

            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  {itemToDelete?.isRecurring 
                    ? 'Este item é recorrente. Como deseja proceder?'
                    : 'Tem certeza que deseja eliminar este item?'
                  }
                </Text>
                
                {itemToDelete && (
                  <Box p={3} bg="gray.50" borderRadius="md">
                    <Text fontWeight="semibold">{itemToDelete.description}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {itemToDelete.category} • {formatCurrency(itemToDelete.amount)}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {itemToDelete.isRecurring ? 'Item Recorrente' : 'Item Único'}
                    </Text>
                  </Box>
                )}

                {itemToDelete?.isRecurring && (
                  <VStack spacing={3} align="stretch">
                    <Text fontWeight="semibold">Opções de eliminação:</Text>
                    <VStack spacing={2} align="stretch">
                      <Button
                        variant={deleteType === 'all' ? 'solid' : 'outline'}
                        colorScheme={deleteType === 'all' ? 'red' : 'gray'}
                        size="sm"
                        onClick={() => setDeleteType('all')}
                        justifyContent="flex-start"
                      >
                        Eliminar todas as instâncias deste item recorrente
                      </Button>
                      <Button
                        variant={deleteType === 'future' ? 'solid' : 'outline'}
                        colorScheme={deleteType === 'future' ? 'red' : 'gray'}
                        size="sm"
                        onClick={() => setDeleteType('future')}
                        justifyContent="flex-start"
                      >
                        Eliminar esta e instâncias futuras deste item recorrente
                      </Button>
                    </VStack>
                  </VStack>
                )}
              </VStack>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setItemToDelete(null)}>
                Cancelar
              </Button>
              <Button 
                colorScheme="red" 
                onClick={() => {
                  if (itemToDelete) {
                    performDeleteItem(itemToDelete, deleteType)
                    setItemToDelete(null)
                  }
                }} 
                ml={3}
              >
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Container>
  )
} 