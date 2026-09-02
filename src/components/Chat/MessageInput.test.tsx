import type { Model } from '@/types';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MessageInput from './MessageInput';

describe('MessageInput', () => {
  const createProps = () => ({
    onSend: vi.fn().mockResolvedValue(undefined),
    isSending: false,
    onModelSelect: vi.fn(),
    currentModel: 'Test Model',
    selectedModelId: 'test-model-1',
    models: [
      {
        id: 'test-model-1',
        name: 'Test Model',
        description: 'Test model',
        capabilities: [],
        status: 'available',
      } as Model,
    ],
    modelsLoading: false,
  });

  it('renders the message input', () => {
    const props = createProps();

    render(<MessageInput {...props} />);

    expect(
      screen.getByPlaceholderText('Send a message')
    ).toBeInTheDocument();
  });

  it('allows the user to type a message', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const input = screen.getByPlaceholderText('Send a message');

    await user.type(input, 'Hello');

    expect(input).toHaveValue('Hello');
  });

  it('enables the send button when a message is entered', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const input = screen.getByPlaceholderText('Send a message');
    const sendButton = screen.getByRole('button', {
      name: 'Send message',
    });

    expect(sendButton).toBeDisabled();

    await user.type(input, 'Hello');

    expect(sendButton).not.toBeDisabled();
  });

  it('sends a message when the send button is clicked', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const input = screen.getByPlaceholderText('Send a message');
    const sendButton = screen.getByRole('button', {
      name: 'Send message',
    });

    await user.type(input, 'Hello');

    await user.click(sendButton);

    expect(props.onSend).toHaveBeenCalledTimes(1);
    expect(props.onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('clears the input after sending a message', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const input = screen.getByPlaceholderText('Send a message');
    const sendButton = screen.getByRole('button', {
      name: 'Send message',
    });

    await user.type(input, 'Hello');

    await user.click(sendButton);

    expect(input).toHaveValue('');
  });

  it('does not send an empty message', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const sendButton = screen.getByRole('button', {
      name: 'Send message',
    });

    expect(sendButton).toBeDisabled();

    await user.click(sendButton);

    expect(props.onSend).not.toHaveBeenCalled();
  });

  it('does not send a whitespace-only message', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const input = screen.getByPlaceholderText('Send a message');
    const sendButton = screen.getByRole('button', {
      name: 'Send message',
    });

    await user.type(input, '   ');

    expect(sendButton).toBeDisabled();

    await user.click(sendButton);

    expect(props.onSend).not.toHaveBeenCalled();
  });

  it('sends the message when Enter is pressed', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const input = screen.getByPlaceholderText('Send a message');

    await user.type(input, 'Hello');
    await user.keyboard('{Enter}');

    expect(props.onSend).toHaveBeenCalledTimes(1);
    expect(props.onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('does not send when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const input = screen.getByPlaceholderText('Send a message');

    await user.type(input, 'Hello');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(props.onSend).not.toHaveBeenCalled();
  });

  it('does not send while a message is being sent', () => {
    const props = createProps();

    render(
      <MessageInput
        {...props}
        isSending={true}
      />
    );

    const sendButton = screen.getByRole('button', {
      name: 'Send message',
    });

    expect(sendButton).toBeDisabled();
  });

  it('changes the creativity level', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(<MessageInput {...props} />);

    const creativityButton = screen.getByRole('button', {
      name: /Medium/i,
    });

    await user.click(creativityButton);

    await user.click(
      screen.getByRole('button', {
        name: 'High',
      })
    );

    expect(
      screen.getByRole('button', {
        name: /High/i,
      })
    ).toBeInTheDocument();
  });

  it('opens the model dropdown', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(
      <MessageInput
        {...props}
        models={[
          {
            id: 'test-model-1',
            name: 'Test Model',
            description: 'Test model',
            capabilities: [],
            status: 'available',
          } as Model,
          {
            id: 'test-model-2',
            name: 'Another Test Model',
            description: 'Another test model',
            capabilities: [],
            status: 'available',
          } as Model,
        ]}
      />
    );

    const modelButton = screen.getByRole('button', {
      name: /Test Model/i,
    });

    await user.click(modelButton);

    expect(
      screen.getByRole('button', {
        name: 'Another Test Model',
      })
    ).toBeInTheDocument();
  });

  it('calls onModelSelect when a model is selected', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(
      <MessageInput
        {...props}
        models={[
          {
            id: 'test-model-1',
            name: 'Test Model',
            description: 'Test model',
            capabilities: [],
            status: 'available',
          } as Model,
          {
            id: 'test-model-2',
            name: 'Another Test Model',
            description: 'Another test model',
            capabilities: [],
            status: 'available',
          } as Model,
        ]}
      />
    );

    const modelButton = screen.getByRole('button', {
      name: /Test Model/i,
    });

    await user.click(modelButton);

    const anotherModelButton = screen.getByRole('button', {
      name: 'Another Test Model',
    });

    await user.click(anotherModelButton);

    expect(props.onModelSelect).toHaveBeenCalledTimes(1);
    expect(props.onModelSelect).toHaveBeenCalledWith('test-model-2');
  });

  it('shows loading state when models are loading', () => {
    const props = createProps();

    render(
      <MessageInput
        {...props}
        modelsLoading={true}
      />
    );

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows a message when no models are available', async () => {
    const user = userEvent.setup();
    const props = createProps();

    render(
      <MessageInput
        {...props}
        models={[]}
        currentModel="No Model"
        selectedModelId={null}
      />
    );

    const modelButton = screen.getByRole('button', {
      name: /No Model/i,
    });

    await user.click(modelButton);

    expect(
      screen.getByText('No models loaded')
    ).toBeInTheDocument();
  });
});