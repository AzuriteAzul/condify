import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  IconButton,
  useColorMode,
  Flex,
  HStack,
  Link,
  InputGroup,
  InputRightElement,
  Divider,
} from '@chakra-ui/react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { MoonIcon, SunIcon, EmailIcon } from '@chakra-ui/icons'
import { FaSignInAlt, FaEye, FaEyeSlash, FaBuilding } from 'react-icons/fa'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A palavra-passe deve ter pelo menos 6 caracteres'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function Login() {
  const toast = useToast()
  const { colorMode, toggleColorMode } = useColorMode()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/';

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const bgColor = colorMode === 'light' ? 'white' : '#18191c'
  const cardBg = colorMode === 'light' ? 'white' : '#23272A'
  const cardBorder = colorMode === 'light' ? '#E2E8F0' : '#2D3748'
  const textColor = colorMode === 'light' ? 'gray.800' : 'white'
  const textColorSecondary = colorMode === 'light' ? 'gray.600' : 'gray.300'
  const inputBg = colorMode === 'light' ? 'gray.50' : '#2B2D31'
  const inputBorder = colorMode === 'light' ? '#CBD5E0' : '#23272A'

  const onLoginSubmit = async (data: LoginFormData) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await signIn(data.email, data.password);
      toast({
        title: 'Login bem-sucedido',
        description: 'Bem-vind@!',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Erro de Login',
        description: error.message || 'Credenciais inválidas. Verifique o seu email e palavra-passe.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box minH="100vh" w="100vw" bg={bgColor} position="relative">
      {/* Navbar with logo and dark mode toggle */}
      <Flex as="nav" align="center" px={8} py={4}>
        <HStack spacing={3}>
          <Box
            w={10}
            h={10}
            borderRadius="xl"
            bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 4px 12px rgba(49, 130, 206, 0.4)"
          >
            <FaBuilding size={20} color="white" />
          </Box>
          <Box>
            <Text fontWeight="bold" fontSize="lg" color={textColor} bg="linear-gradient(135deg, #3182ce 0%, #2b6cb0 100%)" bgClip="text">
              Condify
            </Text>
            <Text fontSize="xs" color={textColorSecondary}>
              Gestão de Condomínio
            </Text>
          </Box>
        </HStack>
        <Box flex={1} />
        <IconButton
          aria-label="Alternar modo escuro/claro"
          icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
          onClick={toggleColorMode}
          variant="ghost"
          colorScheme="blue"
          size="md"
          borderRadius="lg"
        />
      </Flex>

      {/* Centered login card */}
      <Flex minH="calc(100vh - 80px)" align="center" justify="center">
        <Box
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.15)"
          borderWidth="1px"
          borderColor={cardBorder}
          maxW="lg"
          w={{ base: '95vw', sm: '90vw', md: '420px' }}
          p={{ base: 6, md: 10 }}
          overflow="hidden"
        >
          <VStack align="stretch" spacing={6}>
            <Box textAlign="left">
              <Heading size="lg" color={textColor} mb={1}>
                Bem-vind@!
              </Heading>
              <Text color={textColorSecondary} fontSize="md">
                Inicie sessão para aceder à app!
              </Text>
            </Box>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
              <VStack spacing={4} align="stretch">
                <FormControl isInvalid={!!loginForm.formState.errors.email}>
                  <FormLabel color={textColorSecondary} fontWeight="bold" fontSize="sm" letterSpacing={1}>
                    EMAIL
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type="email"
                      placeholder="o.seu@email.com"
                      {...loginForm.register('email')}
                      size="lg"
                      bg={inputBg}
                      color={textColor}
                      borderColor={inputBorder}
                      borderWidth="1.5px"
                      _placeholder={{ color: 'gray.400' }}
                      _hover={{ borderColor: '#3182ce' }}
                      _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1.5px #3182ce' }}
                      borderRadius="md"
                      fontSize="md"
                      py={6}
                    />
                    <InputRightElement>
                      <EmailIcon color="#3182ce" />
                    </InputRightElement>
                  </InputGroup>
                  {loginForm.formState.errors.email && (
                    <Text color="red.400" fontSize="sm" mt={1}>
                      {loginForm.formState.errors.email.message}
                    </Text>
                  )}
                </FormControl>
                <FormControl isInvalid={!!loginForm.formState.errors.password}>
                  <FormLabel color={textColorSecondary} fontWeight="bold" fontSize="sm" letterSpacing={1}>
                    PALAVRA-PASSE
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...loginForm.register('password')}
                      size="lg"
                      bg={inputBg}
                      color={textColor}
                      borderColor={inputBorder}
                      borderWidth="1.5px"
                      _placeholder={{ color: 'gray.400' }}
                      _hover={{ borderColor: '#3182ce' }}
                      _focus={{ borderColor: '#3182ce', boxShadow: '0 0 0 1.5px #3182ce' }}
                      borderRadius="md"
                      fontSize="md"
                      py={6}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPassword ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
                        icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                        onClick={() => setShowPassword(!showPassword)}
                        size="sm"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: '#3182ce' }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {loginForm.formState.errors.password && (
                    <Text color="red.400" fontSize="sm" mt={1}>
                      {loginForm.formState.errors.password.message}
                    </Text>
                  )}
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  isLoading={isLoading}
                  loadingText="A entrar..."
                  leftIcon={<FaSignInAlt />}
                  borderRadius="md"
                  fontWeight="bold"
                  fontSize="md"
                  mt={2}
                >
                  Iniciar Sessão
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </Flex>
    </Box>
  )
} 