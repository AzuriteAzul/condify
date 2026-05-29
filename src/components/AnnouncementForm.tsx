import {
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Select,
  Textarea,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  HStack,
  Box,
  Icon,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Badge,
  Flex,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  InfoIcon, 
  CheckCircleIcon, 
  WarningIcon,
  ChatIcon,
  CalendarIcon,
} from '@chakra-ui/icons'
import { FaUser } from 'react-icons/fa'

interface User {
  email: string
  fraction: string
  name?: string | null
}

const announcementSchema = z.object({
  type: z.enum(['informacao', 'sugestao', 'queixa']),
  category: z.string().min(1, 'Categoria é obrigatória'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
})

type AnnouncementFormData = z.infer<typeof announcementSchema>

interface AnnouncementFormProps {
  user: User
  onSubmit: (data: AnnouncementFormData & { user_email: string; fraction: string }) => void
  onClose: () => void
}

const typeOptions = [
  {
    value: 'informacao',
    label: 'Informação',
    icon: InfoIcon,
    color: 'blue',
    description: 'Partilhar informações importantes com o condomínio'
  },
  {
    value: 'sugestao',
    label: 'Sugestão',
    icon: CheckCircleIcon,
    color: 'green',
    description: 'Propor melhorias ou ideias para o condomínio'
  },
  {
    value: 'queixa',
    label: 'Queixa',
    icon: WarningIcon,
    color: 'red',
    description: 'Reportar problemas ou situações que precisam de atenção'
  }
]

export default function AnnouncementForm({ user, onSubmit, onClose }: AnnouncementFormProps) {
  const toast = useToast()
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const mutedColor = useColorModeValue('gray.600', 'gray.400')
  const textColor = useColorModeValue('gray.800', 'white')
  const textColorSecondary = useColorModeValue('gray.600', 'gray.300')
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      type: 'informacao'
    }
  })

  const selectedType = watch('type')
  const selectedTypeOption = typeOptions.find(option => option.value === selectedType)

  const handleFormSubmit = async (data: AnnouncementFormData) => {
    try {
      onSubmit({
        ...data,
        user_email: user.email,
        fraction: user.fraction,
      })
      toast({
        title: '🎉 Anúncio enviado!',
        description: 'Obrigado pelo seu contributo para o condomínio!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: '❌ Erro',
        description: 'Ocorreu um erro ao enviar o anúncio.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Modal isOpen={true} onClose={onClose} size="2xl">
      <ModalOverlay backdropFilter="blur(10px)" />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Box fontSize="2xl">📢</Box>
            <Box>
              <Text fontSize="xl" fontWeight="bold">Novo</Text>
              <Text fontSize="sm" color={mutedColor}>
                Partilhe informações com o condomínio
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton onClick={onClose} />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <VStack spacing={6}>
              {/* User Info */}
              <Box
                p={4}
                bg={useColorModeValue(`${selectedTypeOption?.color}.50`, `${selectedTypeOption?.color}.900`)}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={useColorModeValue(`${selectedTypeOption?.color}.200`, `${selectedTypeOption?.color}.700`)}
                w="full"
              >
                <HStack spacing={3}>
                  <Box
                    p={2}
                    borderRadius="full"
                    bg={useColorModeValue(`${selectedTypeOption?.color}.100`, `${selectedTypeOption?.color}.800`)}
                    color={useColorModeValue(`${selectedTypeOption?.color}.600`, `${selectedTypeOption?.color}.200`)}
                  >
                    <FaUser />
                  </Box>
                  <Box>
                    <Text fontWeight="semibold" color={textColor}>{user.name || user.email}</Text>
                    <Text fontSize="sm" color={textColorSecondary}>
                      Fração {user.fraction.toUpperCase()}
                    </Text>
                  </Box>
                </HStack>
              </Box>

              {/* Type Selection */}
              <FormControl isInvalid={!!errors.type}>
                <FormLabel fontWeight="semibold" color={textColor}>Tipo de Anúncio</FormLabel>
                <VStack spacing={3} align="stretch">
                  {typeOptions.map((option) => (
                    <Box
                      key={option.value}
                      p={4}
                      borderWidth="2px"
                      borderRadius="lg"
                      cursor="pointer"
                      transition="all 0.2s"
                      bg={selectedType === option.value 
                        ? useColorModeValue(`${option.color}.50`, `${option.color}.900`)
                        : bgColor
                      }
                      borderColor={selectedType === option.value 
                        ? useColorModeValue(`${option.color}.300`, `${option.color}.600`)
                        : borderColor
                      }
                      _hover={{
                        borderColor: useColorModeValue(`${option.color}.300`, `${option.color}.600`),
                        bg: useColorModeValue(`${option.color}.50`, `${option.color}.900`)
                      }}
                      onClick={() => {
                        setValue('type', option.value as 'informacao' | 'sugestao' | 'queixa')
                      }}
                    >
                      <HStack spacing={3}>
                        <Box
                          p={2}
                          borderRadius="full"
                          bg={useColorModeValue(`${option.color}.100`, `${option.color}.800`)}
                          color={useColorModeValue(`${option.color}.600`, `${option.color}.200`)}
                        >
                          <Icon as={option.icon} />
                        </Box>
                        <Box flex={1}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontWeight="semibold" color={textColor}>{option.label}</Text>
                            {selectedType === option.value && (
                              <Badge colorScheme={option.color} variant="solid">
                                Selecionado
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color={textColorSecondary}>
                            {option.description}
                          </Text>
                        </Box>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
                <input
                  {...register('type')}
                  type="hidden"
                />
                {errors.type && (
                  <Text color="red.500" fontSize="sm" mt={2}>
                    {errors.type.message}
                  </Text>
                )}
              </FormControl>

              <Divider />

              {/* Category */}
              <FormControl isInvalid={!!errors.category}>
                <FormLabel fontWeight="semibold" color={textColor}>
                  <HStack spacing={2}>
                    <ChatIcon />
                    <Text>Categoria</Text>
                  </HStack>
                </FormLabel>
                <Input
                  {...register('category')}
                  placeholder="Ex: Manutenção, Segurança, Limpeza, Eventos, etc."
                  size={{ base: "md", md: "lg" }}
                  bg={bgColor}
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: textColorSecondary }}
                  _focus={{
                    borderColor: `${selectedTypeOption?.color}.300`,
                    boxShadow: `0 0 0 1px ${selectedTypeOption?.color}.300`
                  }}
                />
                {errors.category && (
                  <Text color="red.500" fontSize="sm" mt={2}>
                    {errors.category.message}
                  </Text>
                )}
              </FormControl>

              {/* Description */}
              <FormControl isInvalid={!!errors.description}>
                <FormLabel fontWeight="semibold" color={textColor}>
                  <HStack spacing={2}>
                    <InfoIcon />
                    <Text>Descrição</Text>
                  </HStack>
                </FormLabel>
                <Textarea
                  {...register('description')}
                  placeholder="Descreva o seu anúncio em detalhe. Seja claro e específico para que outros condóminos possam entender facilmente."
                  rows={6}
                  size={{ base: "md", md: "lg" }}
                  resize="none"
                  bg={bgColor}
                  borderColor={borderColor}
                  color={textColor}
                  _placeholder={{ color: textColorSecondary }}
                  _focus={{
                    borderColor: `${selectedTypeOption?.color}.300`,
                    boxShadow: `0 0 0 1px ${selectedTypeOption?.color}.300`
                  }}
                />
                {errors.description && (
                  <Text color="red.500" fontSize="sm" mt={2}>
                    {errors.description.message}
                  </Text>
                )}
                <Text fontSize="xs" color={textColorSecondary} mt={2}>
                  Mínimo 10 caracteres
                </Text>
              </FormControl>

              {/* Tips */}
              <Alert
                status="info"
                variant="subtle"
                borderRadius="lg"
                bg={useColorModeValue(`${selectedTypeOption?.color}.50`, `${selectedTypeOption?.color}.900`)}
                borderWidth="1px"
                borderColor={useColorModeValue(`${selectedTypeOption?.color}.200`, `${selectedTypeOption?.color}.700`)}
              >
                <AlertIcon color={useColorModeValue(`${selectedTypeOption?.color}.600`, `${selectedTypeOption?.color}.200`)} />
                <Box>
                  <AlertTitle fontSize="sm" color={useColorModeValue(`${selectedTypeOption?.color}.800`, `${selectedTypeOption?.color}.100`)}>
                    Dica para {selectedTypeOption?.label.toLowerCase()}s
                  </AlertTitle>
                  <AlertDescription fontSize="sm" color={useColorModeValue(`${selectedTypeOption?.color}.700`, `${selectedTypeOption?.color}.200`)}>
                    {selectedType === 'informacao' && 'Seja claro e objetivo. Inclua informações relevantes como datas, horários ou contactos.'}
                    {selectedType === 'sugestao' && 'Explique o benefício da sua sugestão para o condomínio. Seja construtivo!'}
                    {selectedType === 'queixa' && 'Descreva o problema de forma objetiva. Evite linguagem ofensiva e seja específico sobre a localização.'}
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                colorScheme={selectedTypeOption?.color}
                size={{ base: "md", md: "lg" }}
                width="full"
                isLoading={isSubmitting}
                loadingText="A publicar..."
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                transition="all 0.2s"
              >
                📢 Publicar Anúncio
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
} 