import React, { useState, useEffect, useCallback } from 'react'
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
  ModalCloseButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react'
import { FiEdit, FiUsers, FiDollarSign } from 'react-icons/fi'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../lib/supabase'
import { CONFIG, formatCurrency } from '../config'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const MotionBox = motion(Box)
const MotionTr = motion(Tr)

interface UserProfile {
  id: string
  email: string
  fraction: string
  is_admin: boolean
  name?: string | null
  created_at: string
  updated_at: string
}

interface PaymentValue {
  id: string
  fraction: string
  amount: number
  last_updated: string
  updated_by: string
}

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  fraction: z.string().min(1, 'Fração é obrigatória'),
  is_admin: z.boolean(),
})

const paymentSchema = z.object({
  amount: z.number().min(0, 'O valor deve ser positivo.'),
})

type UserFormData = z.infer<typeof userSchema>
type PaymentFormData = z.infer<typeof paymentSchema>

export default function AdminPanel() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [paymentValues, setPaymentValues] = useState<PaymentValue[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentValue | null>(null)
  
  const { isOpen: isUserModalOpen, onOpen: onUserModalOpen, onClose: onUserModalClose } = useDisclosure()
  const { isOpen: isPaymentModalOpen, onOpen: onPaymentModalOpen, onClose: onPaymentModalClose } = useDisclosure()
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure()
  
  const toast = useToast()
  
  const cardBg = useColorModeValue('white', 'gray.800')
  const tableBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400')

  const {
    handleSubmit: handleUserSubmit,
    control: userControl,
    reset: resetUserForm,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { is_admin: false },
  })

  const {
    handleSubmit: handlePaymentSubmit,
    control: paymentControl,
    reset: resetPaymentForm,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, paymentsRes] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('payment_values').select('*').order('fraction', { ascending: true })
      ])
      
      if (usersRes.error) throw usersRes.error
      setUsers(usersRes.data || [])

      if (paymentsRes.error) throw paymentsRes.error
      setPaymentValues(paymentsRes.data || [])

    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, status: 'error' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!user) {
    return (
      <Center minH="50vh">
        <Spinner />
      </Center>
    );
  }

  const openUserModal = (user: UserProfile | null) => {
    setSelectedUser(user)
    resetUserForm(user ? { email: user.email, fraction: user.fraction, is_admin: user.is_admin } : { email: '', fraction: 'A', is_admin: false })
    onUserModalOpen()
  }
  
  const openPaymentModal = (payment: PaymentValue) => {
    setSelectedPayment(payment)
    resetPaymentForm({ amount: payment.amount })
    onPaymentModalOpen()
  }

  const openDeleteModal = (user: UserProfile) => {
    setSelectedUser(user)
    onDeleteModalOpen()
  }

  const onUserFormSubmit = async (data: UserFormData) => {
    try {
      if (selectedUser) { // Update
        const { error } = await supabase.from('users').update(data).eq('id', selectedUser.id)
        if (error) throw error
        toast({ title: 'Condómino atualizado!', status: 'success' })
      } else { // Create
        const { error } = await supabase.from('users').insert(data)
        if (error) throw error
        toast({ title: 'Condómino criado!', status: 'success' })
      }
      loadData()
      onUserModalClose()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, status: 'error' })
    }
  }

  const onPaymentFormSubmit = async (data: PaymentFormData) => {
    if (!selectedPayment) return
    try {
      const { error } = await supabase.from('payment_values').update({ ...data, updated_by: user.email }).eq('id', selectedPayment.id)
      if (error) throw error
      toast({ title: 'Valor de pagamento atualizado!', status: 'success' })
      loadData()
      onPaymentModalClose()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, status: 'error' })
    }
  }

  const onDeleteUser = async () => {
    if (!selectedUser) return
    try {
      const { error } = await supabase.from('users').delete().eq('id', selectedUser.id)
      if (error) throw error
      toast({ title: 'Condómino eliminado!', status: 'success' })
      loadData()
      onDeleteModalClose()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, status: 'error' })
    }
  }

  if (loading) {
    return <Center minH="60vh"><Spinner size="xl" /></Center>
  }
  
  return (
    <Container maxW="container.xl" py={8}>
        <MotionBox initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Heading as="h1" size="2xl" mb={2} color={textColor}>🛡️ Painel de Administração</Heading>
            <Text fontSize="lg" color={textColorSecondary} mb={8}>Gestão de condóminos e outras configurações</Text>
        </MotionBox>
      
      <Tabs isLazy variant="soft-rounded" colorScheme="blue">
        <TabList mb={6}>
          <Tab><FiUsers style={{ marginRight: '8px' }} /> Gestão de Condóminos</Tab>
          <Tab><FiDollarSign style={{ marginRight: '8px' }}/> Valores de Pagamento</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <Alert status="info" borderRadius="md" mb={6}>
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Gestão de Contas de Utilizadores</AlertTitle>
                <AlertDescription>
                  Para criar uma nova conta de condómino, por favor contacte o administrador da plataforma.
                </AlertDescription>
              </Box>
            </Alert>
            <Card bg={cardBg} borderRadius="lg" shadow="sm">
              <CardHeader>
                <Flex align="center">
                  <Heading size="md">Lista de Condóminos</Heading>
                  <Spacer />
                </Flex>
              </CardHeader>
              <CardBody>
                <Box overflowX="auto">
                  <Table variant="simple" size={{ base: "sm", md: "md" }}>
                    <Thead>
                      <Tr>
                        <Th>Nome</Th>
                        <Th>Email</Th>
                        <Th>Fração</Th>
                        <Th>Tipo</Th>
                        <Th>Membro Desde</Th>
                        <Th>Ações</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {users.map((u) => (
                        <MotionTr 
                          key={u.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Td>
                            <Text fontWeight="medium" color={textColor}>
                              {u.name || 'N/A'}
                            </Text>
                          </Td>
                          <Td color={textColorSecondary}>{u.email}</Td>
                          <Td>
                            <Badge colorScheme="blue" variant="subtle">{u.fraction}</Badge>
                          </Td>
                          <Td>
                            {u.is_admin ? (
                              <Badge colorScheme="purple" variant="solid">Admin</Badge>
                            ) : (
                              <Badge colorScheme="gray" variant="solid">Condómino</Badge>
                            )}
                          </Td>
                          <Td color={textColorSecondary}>
                            {new Date(u.created_at).toLocaleDateString('pt-PT')}
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Tooltip label="Editar Condómino">
                                <IconButton
                                  icon={<EditIcon />}
                                  aria-label="Editar"
                                  size="sm"
                                  onClick={() => openUserModal(u)}
                                />
                              </Tooltip>
                              {/* Prevent admin from deleting their own account */}
                              {user.id !== u.id && (
                                <Tooltip label="Eliminar Condómino">
                                  <IconButton
                                    icon={<DeleteIcon />}
                                    aria-label="Eliminar"
                                    colorScheme="red"
                                    size="sm"
                                    onClick={() => openDeleteModal(u)}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </MotionTr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              </CardBody>
            </Card>
          </TabPanel>
          <TabPanel p={0}>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={6}>
              {paymentValues.map(pv => (
                <MotionBox key={pv.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 * paymentValues.indexOf(pv) }}>
                    <Stat as={Box} bg={cardBg} p={6} borderRadius="xl" shadow="sm" >
                    <StatLabel>Fração {pv.fraction}</StatLabel>
                    <StatNumber fontSize="3xl">{formatCurrency(pv.amount)}</StatNumber>
                    <Flex justify="space-between" align="flex-end">
                        <Text fontSize="xs" color={textColorSecondary}>Última atualização: {new Date(pv.last_updated).toLocaleDateString()}</Text>
                        <Button size="sm" leftIcon={<FiEdit />} onClick={() => openPaymentModal(pv)}>Editar</Button>
                    </Flex>
                    </Stat>
                </MotionBox>
              ))}
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
      
      {/* User Create/Edit Modal */}
      <Modal isOpen={isUserModalOpen} onClose={onUserModalClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleUserSubmit(onUserFormSubmit)}>
          <ModalHeader>{selectedUser ? 'Editar' : 'Novo'} Condómino</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Controller name="email" control={userControl} render={({ field }) => <Input {...field} type="email" />} />
              </FormControl>
              <FormControl>
                <FormLabel>Fração</FormLabel>
                <Controller name="fraction" control={userControl} render={({ field }) => (
                  <Select {...field}>
                    {CONFIG.FRACTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </Select>
                )} />
              </FormControl>
              <FormControl>
                <FormLabel>Administrador</FormLabel>
                <Controller name="is_admin" control={userControl} render={({ field }) => (
                    <Select value={field.value ? 'true' : 'false'} onChange={(e) => field.onChange(e.target.value === 'true')}>
                        <option value="true">Sim</option>
                        <option value="false">Não</option>
                    </Select>
                )} />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onUserModalClose} mr={3}>Cancelar</Button>
            <Button type="submit" colorScheme="blue">Guardar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Payment Edit Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={onPaymentModalClose}>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handlePaymentSubmit(onPaymentFormSubmit)}>
          <ModalHeader>Editar Valor para Fração {selectedPayment?.fraction}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Valor Mensal</FormLabel>
              <Controller name="amount" control={paymentControl} render={({ field: { onChange, value } }) => (
                  <NumberInput value={value} onChange={(_, num) => onChange(num)} min={0}>
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
              )} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onPaymentModalClose} mr={3}>Cancelar</Button>
            <Button type="submit" colorScheme="blue">Guardar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirmar Eliminação</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Tem a certeza que pretende eliminar o condómino <Text as="b">{selectedUser?.email}</Text>? Esta ação não pode ser desfeita.</Text>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDeleteModalClose} mr={3}>Cancelar</Button>
            <Button colorScheme="red" onClick={onDeleteUser}>Eliminar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
} 