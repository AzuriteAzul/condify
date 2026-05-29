import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  VStack,
  useToast,
  Text,
  useColorModeValue,
  Divider,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Badge,
  Icon,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Center,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  IconButton,
} from '@chakra-ui/react'
import { 
  EmailIcon, 
  LockIcon, 
  CheckCircleIcon, 
  WarningIcon, 
  InfoIcon,
  EditIcon,
  ViewIcon,
  ViewOffIcon,
} from '@chakra-ui/icons'
import { FaUser, FaShieldAlt, FaEnvelope, FaKey, FaCog } from 'react-icons/fa'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../contexts/AuthContext'
import { motion } from 'framer-motion'

const MotionBox = motion(Box)

interface PasswordFormValues {
  newPassword: string
  confirmPassword: string
}

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Nova password deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "As passwords não coincidem",
  path: ["confirmPassword"],
})

type PasswordFormData = z.infer<typeof passwordSchema>

interface SettingsProps {
  user: {
    email: string
    fraction: string
    is_admin: boolean
    name?: string | null
  }
}

export default function Settings({ user }: SettingsProps) {
  const toast = useToast()
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { isOpen: isPasswordModalOpen, onOpen: onPasswordModalOpen, onClose: onPasswordModalClose } = useDisclosure()
  
  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('gray.800', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.400')
  const textColorMuted = useColorModeValue('gray.500', 'gray.500')

  const { updatePassword } = useAuth()

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onPasswordSubmit = async (data: PasswordFormData) => {
    console.log('Settings: Starting password update...')
    setPasswordLoading(true)
    try {
      console.log('Settings: Calling updatePassword...')
      const { error } = await updatePassword(data.newPassword)
      console.log('Settings: updatePassword response:', { error })
      
      if (error) {
        console.error('Settings: Password update failed:', error)
        throw new Error(error.message || 'Erro ao atualizar password')
      }

      console.log('Settings: Password update successful, showing toast...')
      resetPassword()
      onPasswordModalClose()
      console.log('Settings: Password update completed successfully')
    } catch (error) {
      console.error('Settings: Password update error:', error)
      toast({
        title: 'Erro ao atualizar password',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a password.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      console.log('Settings: Setting passwordLoading to false')
      setPasswordLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  }

  return (
    <Container maxW="container.xl" py={8} pb={32}>
      <MotionBox
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <MotionBox variants={itemVariants} mb={8}>
          <Flex justify="space-between" align="center" mb={6}>
            <Box>
              <HStack spacing={4}>
                <Icon as={FaCog} w={10} h={10} color="blue.500" />
                <Box>
                  <Heading as="h1" size="2xl" color={textColor}>
                    Configurações
                  </Heading>
                  <Text fontSize="lg" color={textColorSecondary}>
                    Gestão da sua conta e preferências
                  </Text>
                </Box>
              </HStack>
            </Box>
          </Flex>
        </MotionBox>

        {/* User Profile Card */}
        <MotionBox variants={itemVariants} mb={8}>
          <Card
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            _hover={{ boxShadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardHeader pb={4}>
              <HStack spacing={4}>
                <Avatar size="lg" name={user.name || user.email} bg="blue.500" />
                <Box>
                  <Heading size="md" color={textColor} mb={1}>
                    {user.name || 'Utilizador'}
                  </Heading>
                  <HStack spacing={4}>
                    <Badge colorScheme="blue" variant="subtle">
                      Fração {user.fraction.toUpperCase()}
                    </Badge>
                    <Badge colorScheme={user.is_admin ? "purple" : "green"} variant="subtle">
                      {user.is_admin ? 'Administrador' : 'Utilizador'}
                    </Badge>
                  </HStack>
                </Box>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Stat>
                  <StatLabel color={textColorSecondary}>Email</StatLabel>
                  <StatNumber fontSize="md" color={textColor}>{user.email}</StatNumber>
                  <StatHelpText>
                    <StatArrow type="increase" />
                    Ativo
                  </StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel color={textColorSecondary}>Fração</StatLabel>
                  <StatNumber fontSize="md" color={textColor}>{user.fraction.toUpperCase()}</StatNumber>
                  <StatHelpText>Atribuída</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel color={textColorSecondary}>Tipo de Conta</StatLabel>
                  <StatNumber fontSize="md" color={textColor}>
                    {user.is_admin ? 'Administrador' : 'Utilizador'}
                  </StatNumber>
                  <StatHelpText>
                    {user.is_admin ? 'Acesso total' : 'Acesso limitado'}
                  </StatHelpText>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>
        </MotionBox>

        {/* Settings Options */}
        <MotionBox variants={itemVariants}>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Email Information */}
            <Card
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              _hover={{ 
                borderColor: 'blue.300',
                boxShadow: 'lg',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.2s"
            >
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="full"
                      bg="blue.100"
                      color="blue.600"
                    >
                      <FaEnvelope size={20} />
                    </Box>
                    <Box flex={1}>
                      <Heading size="md" color={textColor} mb={1}>
                        Email de Acesso
                      </Heading>
                      <Text color={textColorSecondary} fontSize="sm">
                        {user.email}
                      </Text>
                    </Box>
                    <Box color={textColorSecondary}>
                      <InfoIcon />
                    </Box>
                  </HStack>
                  
                  <Alert status="info" variant="subtle" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Alteração de Email</AlertTitle>
                      <AlertDescription fontSize="sm">
                        Para alterar o seu email de acesso, contacte o administrador da plataforma.
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>

            {/* Password Settings */}
            <Card
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              _hover={{ 
                borderColor: 'green.300',
                boxShadow: 'lg',
                transform: 'translateY(-2px)'
              }}
              transition="all 0.2s"
              cursor="pointer"
              onClick={onPasswordModalOpen}
            >
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="full"
                      bg="green.100"
                      color="green.600"
                    >
                      <FaKey size={20} />
                    </Box>
                    <Box flex={1}>
                      <Heading size="md" color={textColor} mb={1}>
                        Alterar Password
                      </Heading>
                      <Text color={textColorSecondary} fontSize="sm">
                        Atualizar a password de acesso
                      </Text>
                    </Box>
                    <EditIcon color={textColorSecondary} />
                  </HStack>
                  
                  <Alert status="warning" variant="subtle" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Segurança</AlertTitle>
                      <AlertDescription fontSize="sm">
                        Use uma password forte com pelo menos 6 caracteres
                      </AlertDescription>
                    </Box>
                  </Alert>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </MotionBox>

        {/* Security Tips */}
        <MotionBox variants={itemVariants} mt={8}>
          <Card
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <CardHeader pb={4}>
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="full"
                  bg="purple.100"
                  color="purple.600"
                >
                  <FaShieldAlt size={20} />
                </Box>
                <Heading size="md" color={textColor}>
                  Dicas de Segurança
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="stretch">
                <HStack spacing={3}>
                  <CheckCircleIcon color="green.500" />
                  <Text color={textColorSecondary} fontSize="sm">
                    Use passwords únicas e complexas para cada conta
                  </Text>
                </HStack>
                <HStack spacing={3}>
                  <CheckCircleIcon color="green.500" />
                  <Text color={textColorSecondary} fontSize="sm">
                    Ative a autenticação de dois fatores quando disponível
                  </Text>
                </HStack>
                <HStack spacing={3}>
                  <CheckCircleIcon color="green.500" />
                  <Text color={textColorSecondary} fontSize="sm">
                    Mantenha o seu email atualizado para receber notificações importantes
                  </Text>
                </HStack>
                <HStack spacing={3}>
                  <CheckCircleIcon color="green.500" />
                  <Text color={textColorSecondary} fontSize="sm">
                    Nunca partilhe as suas credenciais de acesso
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </MotionBox>
      </MotionBox>

      {/* Password Update Modal */}
      <Modal isOpen={isPasswordModalOpen} onClose={onPasswordModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={3}>
              <Box fontSize="2xl">🔒</Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold">Alterar Password</Text>
                <Text fontSize="sm" color={textColorSecondary}>
                  Atualizar a password de acesso
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
              <VStack spacing={6}>
                <Alert status="warning" variant="subtle" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Segurança</AlertTitle>
                    <AlertDescription fontSize="sm">
                      Use uma password forte com pelo menos 6 caracteres
                    </AlertDescription>
                  </Box>
                </Alert>

                <FormControl isInvalid={!!passwordErrors.newPassword}>
                  <FormLabel fontWeight="semibold" color={textColor}>
                    <HStack spacing={2}>
                      <LockIcon />
                      <Text>Nova Password</Text>
                    </HStack>
                  </FormLabel>
                  <HStack>
                    <Input
                      type={showPassword ? "text" : "password"}
                      {...registerPassword('newPassword')}
                      placeholder="Introduza a nova password"
                      size={{ base: "md", md: "lg" }}
                      _focus={{
                        borderColor: 'green.300',
                        boxShadow: '0 0 0 1px green.300'
                      }}
                    />
                    <IconButton
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      size={{ base: "md", md: "lg" }}
                    />
                  </HStack>
                  {passwordErrors.newPassword && (
                    <Text color="red.500" fontSize="sm" mt={2}>
                      {passwordErrors.newPassword.message}
                    </Text>
                  )}
                </FormControl>

                <FormControl isInvalid={!!passwordErrors.confirmPassword}>
                  <FormLabel fontWeight="semibold" color={textColor}>
                    <HStack spacing={2}>
                      <LockIcon />
                      <Text>Confirmar Nova Password</Text>
                    </HStack>
                  </FormLabel>
                  <HStack>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      {...registerPassword('confirmPassword')}
                      placeholder="Confirme a nova password"
                      size={{ base: "md", md: "lg" }}
                      _focus={{
                        borderColor: 'green.300',
                        boxShadow: '0 0 0 1px green.300'
                      }}
                    />
                    <IconButton
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      size={{ base: "md", md: "lg" }}
                    />
                  </HStack>
                  {passwordErrors.confirmPassword && (
                    <Text color="red.500" fontSize="sm" mt={2}>
                      {passwordErrors.confirmPassword.message}
                    </Text>
                  )}
                </FormControl>

                <Alert status="info" variant="subtle" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Lembrete</AlertTitle>
                    <AlertDescription fontSize="sm">
                      Após alterar a password, será necessário fazer login novamente.
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onPasswordModalClose}>
              Cancelar
            </Button>
            <Button
              colorScheme="green"
              onClick={handlePasswordSubmit(onPasswordSubmit)}
              isLoading={passwordLoading}
              loadingText="A atualizar..."
            >
              Atualizar Password
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  )
} 